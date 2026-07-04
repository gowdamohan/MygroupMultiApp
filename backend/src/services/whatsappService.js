/**
 * WhatsApp OTP delivery via MSG91 WhatsApp API (v5 outbound)
 */

const MSG91_WHATSAPP_URL =
  'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/';

const DEFAULT_INTEGRATED_NUMBER = '917353247365';

/**
 * Format Indian mobile number with country code (e.g. 919876543210).
 * Strictly prepends 91 to any 10-digit number.
 */
const formatPhoneNumber = (mobile) => {
  let digits = String(mobile).replace(/\D/g, '');

  // Normalize 11-digit numbers starting with 0 (e.g. 09876543210)
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }

  throw new Error('Invalid mobile number. Expected a 10-digit Indian mobile number.');
};

/**
 * Build template components array for MSG91 v5 single outbound API.
 * mygroup template expects 2 body params: greeting ({{1}}) and OTP ({{2}}).
 */
const buildOtpComponents = (otp) => {
  const otpValue = String(otp);
  const greetingParam =
    process.env.WHATSAPP_TEMPLATE_BODY_PARAM_1 || 'Hello Mygroup user';

  const components = [
    {
      type: 'body',
      parameters: [
        {
          type: 'text',
          text: greetingParam
        },
        {
          type: 'text',
          text: otpValue
        }
      ]
    }
  ];

  // Authentication templates with a Copy Code button require this second component
  if (process.env.WHATSAPP_TEMPLATE_HAS_BUTTON === 'true') {
    components.push({
      type: 'button',
      sub_type: 'copy_code',
      index: '0',
      parameters: [
        {
          type: 'coupon_code',
          coupon_code: otpValue
        }
      ]
    });
  }

  return components;
};

/**
 * Send OTP via WhatsApp template message
 * @param {string} mobile - 10-digit mobile number
 * @param {string} otp - 6-digit OTP
 */
export const sendWhatsAppOtp = async (mobile, otp) => {
  const authkey = process.env.WHATSAPP_AUTH_KEY || '543373AzRX4OlX26a37b2f7P1';
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'mygroup';
  const integratedNumber =
    process.env.WHATSAPP_INTEGRATED_NUMBER || DEFAULT_INTEGRATED_NUMBER;
  const namespace = process.env.WHATSAPP_TEMPLATE_NAMESPACE;
  const languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en';

  const recipientNumber = formatPhoneNumber(mobile);

  if (!namespace) {
    console.warn(
      'WhatsApp: WHATSAPP_TEMPLATE_NAMESPACE is not set. Template delivery may fail.'
    );
  }

  const template = {
    name: templateName,
    language: {
      code: languageCode,
      policy: 'deterministic'
    },
    components: buildOtpComponents(otp)
  };

  if (namespace) {
    template.namespace = namespace;
  }

  const payload = {
    integrated_number: integratedNumber,
    content_type: 'template',
    payload: {
      messaging_product: 'whatsapp',
      to: recipientNumber,
      type: 'template',
      template
    }
  };

  console.log(
    `[WhatsApp] Sending template "${templateName}" from ${integratedNumber} to ${recipientNumber}`
  );

  const response = await fetch(MSG91_WHATSAPP_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      authkey,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const rawText = await response.text();
  let data = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { raw: rawText };
  }

  console.log('[WhatsApp] MSG91 response:', JSON.stringify(data));

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?.errors ||
      rawText ||
      `WhatsApp API error (${response.status})`;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  const hasError =
    data?.type === 'error' ||
    data?.status === 'fail' ||
    data?.success === false;

  if (hasError) {
    const message =
      data?.message || data?.error || data?.errors || 'WhatsApp API returned an error';
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  return { success: true, data };
};
