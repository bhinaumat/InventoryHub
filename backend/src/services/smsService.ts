/**
 * SMS OTP Service using Fast2SMS
 * 
 * Falls back to console logging if FAST2SMS_API_KEY is not set.
 * Sign up at https://www.fast2sms.com/ to get your free API key.
 */

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || '';
const FAST2SMS_URL = 'https://www.fast2sms.com/bulkV2/pgApi/sms';

interface SMSResponse {
    return: boolean;
    request_id: string;
    message: string[];
}

/**
 * Send OTP via Fast2SMS
 * @param phone - 10-digit Indian mobile number (without +91)
 * @param otp - The OTP code to send
 * @returns true if sent successfully, false otherwise
 */
export const sendOTP = async (phone: string, otp: string): Promise<boolean> => {
    // Clean phone number — remove +91, spaces, dashes
    const cleanPhone = phone.replace(/[\s\-\+]/g, '').replace(/^91/, '');

    if (!FAST2SMS_API_KEY) {
        console.log(`\n========================================`);
        console.log(`  📱 SMS OTP (Console Fallback)`);
        console.log(`  To: ${cleanPhone}`);
        console.log(`  OTP: ${otp}`);
        console.log(`  ⚠️  Set FAST2SMS_API_KEY in .env for real SMS`);
        console.log(`========================================\n`);
        return true;
    }

    try {
        const response = await fetch(FAST2SMS_URL, {
            method: 'POST',
            headers: {
                'authorization': FAST2SMS_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                route: 'otp',
                variables_values: otp,
                flash: '0',
                numbers: cleanPhone,
            }),
        });

        const data: SMSResponse = await response.json();

        if (data.return) {
            console.log(`✅ SMS OTP sent to ${cleanPhone} | Request ID: ${data.request_id}`);
            return true;
        } else {
            console.error(`❌ Fast2SMS error:`, data.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Failed to send SMS OTP:', error);
        // Fallback to console in case of network error
        console.log(`\n========================================`);
        console.log(`  📱 SMS OTP (Fallback - Send Failed)`);
        console.log(`  To: ${cleanPhone}`);
        console.log(`  OTP: ${otp}`);
        console.log(`========================================\n`);
        return false;
    }
};

/**
 * Send a custom SMS message via Fast2SMS
 * @param phone - 10-digit Indian mobile number
 * @param message - The message content
 */
export const sendSMS = async (phone: string, message: string): Promise<boolean> => {
    const cleanPhone = phone.replace(/[\s\-\+]/g, '').replace(/^91/, '');

    if (!FAST2SMS_API_KEY) {
        console.log(`\n========================================`);
        console.log(`  📱 SMS (Console Fallback)`);
        console.log(`  To: ${cleanPhone}`);
        console.log(`  Message: ${message}`);
        console.log(`  ⚠️  Set FAST2SMS_API_KEY in .env for real SMS`);
        console.log(`========================================\n`);
        return true;
    }

    try {
        const response = await fetch(FAST2SMS_URL, {
            method: 'POST',
            headers: {
                'authorization': FAST2SMS_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                route: 'q',
                message: message,
                flash: '0',
                numbers: cleanPhone,
            }),
        });

        const data: SMSResponse = await response.json();
        return data.return;
    } catch (error) {
        console.error('❌ Failed to send SMS:', error);
        return false;
    }
};

export default { sendOTP, sendSMS };
