// File: netlify/functions/rag-bot.js
// 1. IMPORT AND INITIALIZE
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({});
// 2. KNOWLEDGE BASE (In-Context Learning Content)
const POLICY_KNOWLEDGE = `
 [START COMPANY POLICY]
 # SECTION 1: HR & LEAVE POLICY (Human Resources)
 ## 1.1 Annual Leave (AL)
 - Entitlement: All full-time employees receive 15 days of Annual Leave
per calendar year.
 - Accrual: Leave is accrued monthly.
 - Carry-over: A maximum of 5 unused AL days can be carried over to the
next year.
 - Approval Process: All AL requests must be submitted through the Odoo HR
system and approved by the direct manager at least 7 days in advance.
 ## 1.2 Remote Work Policy
 - Eligibility: Employees in roles classified as 'Flexible' are eligible
for remote work.
 - Schedule: Employees may work remotely up to two days per week (Tuesdays
and Thursdays are preferred).
 - Equipment: The company provides a laptop and monitor. Any additional
home office expenses (e.g., high-speed internet) are reimbursed up to $50 USD
per month.
 # SECTION 2: IT & ASSET MANAGEMENT
 ## 2.1 Password Security
 - Requirement: All employee passwords must be updated every 60 days.
 - Complexity: Passwords must be a minimum of 10 characters and include at
least one uppercase letter, one number, and one special character (!@#$).
 ## 2.2 Device Policy (Laptops)
 - Ownership: All company-issued laptops remain the property of the
company.
 - Software Installation: Employees are strictly prohibited from
installing unauthorized third-party software. Only IT Department staff may
install software.
 # SECTION 3: SALES & COMMISSION
 ## 3.1 Sales Commission Structure
 - Standard Rate: Sales staff earn a 5% commission on the gross profit of
all successful sales orders.
 - Bonus Tier: An additional 2% bonus is paid if the monthly sales target
exceeds $50,000 USD.
 - Payment: Commissions are paid monthly, on the 10th business day
following the close of the month.
 [END COMPANY POLICY]
`;
// 3. MAIN HANDLER
exports.handler = async (event) => {
 // === 3.1. FIX: Handle CORS Preflight (OPTIONS) Request ===
 if (event.httpMethod === "OPTIONS") {
 return {
 statusCode: 204,
 headers: {
 "Access-Control-Allow-Origin": "*",
 "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
 "Access-Control-Allow-Headers": "Content-Type",
 "Access-Control-Max-Age": "86400",
 },
 body: ''
 };
 }

 if (event.httpMethod !== "POST") {
 return { statusCode: 405, body: "Method Not Allowed" };
 }
 try {
 const { user_query } = JSON.parse(event.body);
 // 3.2. DEFINE ROLE AND CONSTRUCT ICL PROMPT
 const system_prompt = `You are a strict internal policy assistant.
Answer employee questions ONLY based on the following policy document. If the
information is not explicitly found in the document, reply with: "Sorry, I
cannot find this information in the policy document."`;

 const full_prompt =
`${system_prompt}\n\n${POLICY_KNOWLEDGE}\n\nQuestion: ${user_query}`;

 // 3.3. CALL GEMINI API
 const response = await ai.models.generateContent({
 model: 'gemini-2.5-flash',
 contents: full_prompt,
 config: {
 temperature: 0.1,
 }
 });
 const bot_answer = response.text.trim();
 // 3.4. SUCCESS RESPONSE
 return {
 statusCode: 200,
 headers: {
 "Content-Type": "application/json",
 "Access-Control-Allow-Origin": "*",
 "Access-Control-Allow-Methods": "POST, OPTIONS",
 "Access-Control-Allow-Headers": "Content-Type",
 },
 body: JSON.stringify({
 answer: bot_answer,
 }),
 };
 } catch (error) {
 console.error("Gemini API Error:", error);

 // 3.5. ERROR RESPONSE
 return {
 statusCode: 500,
 headers: {
 "Access-Control-Allow-Origin": "*",
 "Access-Control-Allow-Methods": "POST, OPTIONS",
 "Access-Control-Allow-Headers": "Content-Type",
 "Content-Type": "application/json"
 },
 body: JSON.stringify({
 error: "AI Internal Error. Please check GEMINI_API_KEY/Credit
on Netlify."
 })
 };
 }
};
