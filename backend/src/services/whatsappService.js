/**
 * WhatsApp OTP delivery via MSG91 WhatsApp API
 */

const MSG91_WHATSAPP_URL =
  'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/';

/**
 * Format Indian mobile number to E.164 without + (e.g. 919876543210)
 */
const formatPhoneNumber = (mobile) => {
  const digits = String(mobile).replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits;
};

/**
 * Send OTP via WhatsApp template message
 * @param {string} mobile - 10-digit mobile number
 * @param {string} otp - 6-digit OTP
 */
export const sendWhatsAppOtp = async (mobile, otp) => {
  const authkey = process.env.WHATSAPP_AUTH_KEY || '543373AzRX4OlX26a37b2f7P1';
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'mygroup';
  const integratedNumber = process.env.WHATSAPP_INTEGRATED_NUMBER;
  const namespace = process.env.WHATSAPP_TEMPLATE_NAMESPACE;
  const languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en';

  if (!integratedNumber || !namespace) {
    console.warn(
      'WhatsApp: WHATSAPP_INTEGRATED_NUMBER or WHATSAPP_TEMPLATE_NAMESPACE not set. OTP logged to console.'
    );
    console.log(`[WhatsApp OTP] mobile=${mobile} otp=${otp}`);
    return { success: true, devMode: true };
  }

  const phone = formatPhoneNumber(mobile);

  const payload = {
    integrated_number: integratedNumber,
    content_type: 'template',
    payload: {
      messaging_product: 'whatsapp',
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
          policy: 'deterministic'
        },
        namespace,
        to_and_components: [
          {
            to: [phone],
            components: {
              body_1: {
                type: 'text',
                value: otp
              }
            }
          }
        ]
      }
    }
  };

  const response = await fetch(MSG91_WHATSAPP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || data?.errors || `WhatsApp API error (${response.status})`;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  return { success: true, data };
};
