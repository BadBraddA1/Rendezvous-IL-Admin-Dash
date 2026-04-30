// Infobip SMS integration
// Env vars needed:
// - infobip: JSON string with { apiKey, baseUrl, sender } or individual vars
// - INFOBIP_API_KEY, INFOBIP_BASE_URL, INFOBIP_SENDER (fallbacks)

interface InfobipConfig {
  apiKey: string
  baseUrl: string
  sender: string
}

function getInfobipConfig(): InfobipConfig {
  // Try parsing the `infobip` env var as JSON first
  const infobipEnv = process.env.infobip
  if (infobipEnv) {
    try {
      const parsed = JSON.parse(infobipEnv)
      if (parsed.apiKey && parsed.baseUrl && parsed.sender) {
        return parsed
      }
    } catch {
      // Not JSON, might be just the API key
    }
  }

  // Fall back to individual env vars
  const apiKey = infobipEnv || process.env.INFOBIP_API_KEY
  const baseUrl = process.env.INFOBIP_BASE_URL || "https://api.infobip.com"
  const sender = process.env.INFOBIP_SENDER || "Rendezvous"

  if (!apiKey) {
    throw new Error("Infobip API key not configured. Set 'infobip' or 'INFOBIP_API_KEY' env var.")
  }

  return { apiKey, baseUrl, sender }
}

export async function sendSMS(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = getInfobipConfig()
  
  // Normalize phone number - ensure it starts with country code
  let phone = to.replace(/\D/g, "")
  if (phone.startsWith("1") && phone.length === 11) {
    // US number with country code
  } else if (phone.length === 10) {
    // US number without country code
    phone = "1" + phone
  }

  const url = `${config.baseUrl}/sms/2/text/advanced`
  
  const payload = {
    messages: [
      {
        destinations: [{ to: phone }],
        from: config.sender,
        text: message,
      },
    ],
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `App ${config.apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.requestError?.serviceException?.text || data.message || `HTTP ${response.status}`,
      }
    }

    const messageId = data.messages?.[0]?.messageId
    return { success: true, messageId }
  } catch (err: any) {
    return { success: false, error: err.message || "Network error" }
  }
}

export function checkInfobipConfig(): { configured: boolean; error?: string } {
  try {
    getInfobipConfig()
    return { configured: true }
  } catch (err: any) {
    return { configured: false, error: err.message }
  }
}
