import tls from 'node:tls'

function required(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Falta configurar la variable ${name}.`)
  return value
}

function smtpPort() {
  const raw = process.env.SMTP_PORT?.trim() || '465'
  const port = Number(raw)
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('SMTP_PORT debe ser un puerto válido.')
  }
  return port
}

function isSecureSmtpEnabled() {
  const raw = process.env.SMTP_SECURE?.trim().toLowerCase()
  return !raw || raw === 'true' || raw === '1' || raw === 'yes'
}

interface SmtpReply {
  code: number
  message: string
}

function extractEmailAddress(value: string) {
  const match = value.match(/<([^>]+)>/)
  return (match?.[1] || value).trim()
}

function encodeHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`
}

function dotStuff(value: string) {
  return value
    .replace(/\r?\n/g, '\r\n')
    .split('\r\n')
    .map((line) => (line.startsWith('.') ? `.${line}` : line))
    .join('\r\n')
}

class SmtpReader {
  private buffer = ''
  private lines: string[] = []
  private queue: SmtpReply[] = []
  private waiters: Array<(reply: SmtpReply) => void> = []

  push(chunk: Buffer) {
    this.buffer += chunk.toString('utf8')

    while (true) {
      const index = this.buffer.indexOf('\r\n')
      if (index < 0) break

      const line = this.buffer.slice(0, index)
      this.buffer = this.buffer.slice(index + 2)
      this.lines.push(line)

      if (/^\d{3} /.test(line)) {
        const code = Number(line.slice(0, 3))
        const message = this.lines.join('\n')
        this.lines = []
        this.emit({ code, message })
      }
    }
  }

  private emit(reply: SmtpReply) {
    const waiter = this.waiters.shift()
    if (waiter) waiter(reply)
    else this.queue.push(reply)
  }

  next(timeoutMs = 15000) {
    const queued = this.queue.shift()
    if (queued) return Promise.resolve(queued)

    return new Promise<SmtpReply>((resolve, reject) => {
      const timer = setTimeout(() => {
        const index = this.waiters.indexOf(done)
        if (index >= 0) this.waiters.splice(index, 1)
        reject(new Error('Tiempo de espera agotado leyendo respuesta SMTP.'))
      }, timeoutMs)

      const done = (reply: SmtpReply) => {
        clearTimeout(timer)
        resolve(reply)
      }

      this.waiters.push(done)
    })
  }
}

async function expectReply(
  reader: SmtpReader,
  expectedCodes: number[],
) {
  const reply = await reader.next()
  if (!expectedCodes.includes(reply.code)) {
    throw new Error(`SMTP ${reply.code}: ${reply.message}`)
  }
  return reply
}

interface SendEmailInput {
  to: string
  subject: string
  text: string
  html?: string
}

/**
 * Cliente SMTP SSL/TLS sencillo para el envío de notificaciones.
 * Está pensado para SMTP seguro por puerto 465, incluido Gmail/Workspace
 * con contraseña de aplicación. No expone credenciales al navegador.
 */
export async function sendEmail(input: SendEmailInput) {
  if (!isSecureSmtpEnabled()) {
    throw new Error(
      'Esta configuración usa SMTP seguro. Configura SMTP_SECURE=true y normalmente SMTP_PORT=465.',
    )
  }

  const host = required('SMTP_HOST')
  const port = smtpPort()
  const user = required('SMTP_USER')
  const rawPassword = required('SMTP_PASSWORD')
  const password = host === 'smtp.gmail.com' ? rawPassword.replace(/\s+/g, '') : rawPassword
  const from = required('EMAIL_FROM')
  const fromAddress = extractEmailAddress(from)

  const socket = tls.connect({
    host,
    port,
    servername: host,
    rejectUnauthorized: true,
  })

  const reader = new SmtpReader()
  socket.on('data', (chunk: Buffer) => reader.push(chunk))

  const socketReady = new Promise<void>((resolve, reject) => {
    socket.once('secureConnect', resolve)
    socket.once('error', reject)
    socket.setTimeout(20000, () => {
      reject(new Error('Tiempo de espera agotado conectando al servidor SMTP.'))
      socket.destroy()
    })
  })

  function write(value: string) {
    socket.write(`${value}\r\n`)
  }

  try {
    await socketReady
    await expectReply(reader, [220])

    write('EHLO santaveronica.local')
    await expectReply(reader, [250])

    write('AUTH LOGIN')
    await expectReply(reader, [334])

    write(Buffer.from(user, 'utf8').toString('base64'))
    await expectReply(reader, [334])

    write(Buffer.from(password, 'utf8').toString('base64'))
    await expectReply(reader, [235])

    write(`MAIL FROM:<${fromAddress}>`)
    await expectReply(reader, [250])

    write(`RCPT TO:<${input.to}>`)
    await expectReply(reader, [250, 251])

    write('DATA')
    await expectReply(reader, [354])

    const boundary = `sveronica-${Date.now()}-${Math.random().toString(16).slice(2)}`
    const html = input.html || `<pre>${input.text}</pre>`

    const message = [
      `From: ${from}`,
      `To: ${input.to}`,
      `Subject: ${encodeHeader(input.subject)}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(input.text, 'utf8').toString('base64'),
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(html, 'utf8').toString('base64'),
      `--${boundary}--`,
      '',
    ].join('\r\n')

    socket.write(`${dotStuff(message)}\r\n.\r\n`)
    const sentReply = await expectReply(reader, [250])

    write('QUIT')
    await expectReply(reader, [221]).catch(() => null)

    return {
      message: sentReply.message,
      accepted: [input.to],
    }
  } finally {
    socket.end()
  }
}
