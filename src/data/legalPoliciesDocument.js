const EFFECTIVE_DATE = '17 August 2026';

function createPolicy(title, text) {
  const sections = [];
  let current = null;

  text.trim().split(/\r?\n/).forEach((line) => {
    const sectionMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (sectionMatch) {
      current = {
        number: sectionMatch[1],
        title: sectionMatch[2],
        fullTitle: `${sectionMatch[1]}. ${sectionMatch[2]}`,
        blocks: []
      };
      sections.push(current);
      return;
    }

    if (current && line.trim()) {
      current.blocks.push({ type: 'paragraph', text: line.trim() });
    }
  });

  return { title, effectiveDate: EFFECTIVE_DATE, sections };
}

export const ACCEPTABLE_USE_POLICY = createPolicy('Acceptable Use Policy', `
1. Purpose and Scope
This Acceptable Use Policy (“AUP”) sets the rules for Inputs, Outputs, Account activity and use of the Dexeric AI Service. It applies to every user and forms part of the Terms of Service.
The examples below are not exhaustive. Conduct that creates a comparable legal, safety, security or abuse risk may also be restricted.
2. General Responsibility
You are responsible for every Input submitted through your Account and for how you use, edit, label, distribute or commercialise an Output.
You must use the Service lawfully, in good faith and with respect for the rights, safety and dignity of others. An Output passing an automated filter does not mean that it is lawful, accurate or permitted.
3. Illegal Activity
You must not use the Service to create, facilitate, promote or conceal illegal activity, including fraud, exploitation, trafficking, unlawful discrimination, criminal intimidation, evasion of legal restrictions or the sale of illegal goods or services.
You must not use the Service in a jurisdiction where it is unavailable or where your access would violate applicable law.
4. Child Safety and Exploitation
You must not generate, attempt to generate, request, possess, distribute or promote:
child sexual abuse material;
sexualised depictions of a person under 18, whether real, fictional or AI-generated;
content that facilitates grooming, exploitation or trafficking of minors;
content that depicts or normalises sexual activity involving minors; or
content designed to evade child-safety detection.
Dexeric may immediately suspend an Account, preserve relevant evidence and report suspected child exploitation to competent authorities or recognised reporting bodies where required or permitted by law.
5. Sexual and Intimate Content
You must not use the Service to create:
sexually explicit or pornographic content;
non-consensual intimate imagery;
sexualised depictions of an identifiable person without that person’s valid consent;
content depicting sexual violence, coercion or exploitation; or
content used for sexual extortion, harassment or humiliation.
Consent cannot be inferred from a person’s public status, an existing photograph, a prior relationship or the availability of material online.
6. Violence, Terrorism and Extremism
You must not use the Service to:
glorify, support or recruit for a terrorist or violent extremist organisation;
depict graphic violence primarily for shock, intimidation or sadistic gratification;
make a credible threat or encourage violence against a person or group;
create propaganda or operational material for violent wrongdoing; or
celebrate or facilitate real-world mass violence.
Contextual uses such as education, news reporting or artistic commentary may still be restricted where the content creates a material safety risk or violates law.
7. Hate, Harassment and Abuse
You must not generate content that:
attacks, dehumanises or promotes hatred against people based on race, ethnicity, nationality, religion, caste, disability, sex, gender identity, sexual orientation or another protected characteristic;
encourages exclusion, segregation or violence against a protected group;
targets an identifiable person with threats, severe harassment or degrading abuse; or
is intended to facilitate stalking, doxxing or coordinated harassment.
8. Self-Harm and Dangerous Conduct
You must not use the Service to encourage, romanticise or provide personalised assistance for suicide, self-harm, eating-disorder behaviour or dangerous acts likely to cause serious injury.
Supportive, preventive, educational or recovery-oriented content may be permitted where it does not include harmful instructions or targeting.
9. Deception, Fraud and Impersonation
You must not use the Service to create or distribute content intended to deceive people about a material fact, including:
fraudulent advertisements, investment schemes or payment requests;
forged evidence, identity documents, credentials or official records;
phishing or social-engineering material;
false endorsements or fabricated statements attributed to a real person;
impersonation intended to obtain money, access, data or another benefit; or
misleading depictions presented as authentic documentation of a real event.
Satire, parody and fiction must not be presented in a manner reasonably likely to deceive an audience about a material fact.
10. Deepfakes and Synthetic Media
You must not create or use a realistic synthetic depiction of an identifiable person without a lawful basis where the content is likely to deceive, exploit, defame, harass or cause material harm.
When an Output constitutes a deepfake or other realistically generated or manipulated image, you must provide a clear disclosure of its artificial origin wherever required by law. You must not remove or obscure a machine-readable AI marker, Content Credential or visible disclosure for the purpose of deception or evading a legal obligation.
11. Elections and Public Affairs
You must not use the Service to:
misrepresent voting procedures, eligibility, time or location;
impersonate an election authority, candidate or public official deceptively;
fabricate an event or statement in a manner intended to manipulate civic participation; or
conduct unlawful political advertising, voter suppression or covert influence activity.
Lawful commentary, satire and creative expression remain subject to transparency, impersonation and applicable election-law requirements.
12. Privacy and Personal Data
You must not include in an Input or use an Output to expose:
private contact details, financial information, credentials or precise location without authorisation;
health, biometric or other sensitive data without a lawful basis;
confidential communications or records obtained unlawfully; or
information intended to facilitate identity theft, stalking, discrimination or other harm.
You must not create a biometric database, face-recognition dataset or surveillance system using the Service without a lawful basis and Dexeric’s prior written approval.
13. Intellectual Property and Other Rights
You must not use the Service in a manner that infringes or is intended to infringe copyright, trademark, design, publicity, privacy, contractual or other rights.
Prohibited conduct includes requesting or using Outputs as counterfeit branding, passing off, false endorsement, unauthorised merchandise or a substitute for protected content where the use is unlawful.
References to an artist, brand, character, person or work in an Input do not guarantee that the resulting use is lawful. You are responsible for rights clearance.
14. Regulated and High-Risk Uses
You must not represent an Output as a verified professional, scientific or official assessment. Without all approvals and safeguards required by law, you must not use the Service to make or support decisions concerning:
employment, housing, insurance, credit or education eligibility;
medical diagnosis or treatment;
legal rights or access to essential services;
law-enforcement identification or evidentiary conclusions; or
biometric categorisation or emotion recognition.
The Service is not designed as a high-risk decision system.
15. Security and Platform Abuse
You must not:
probe, scan or test the vulnerability of the Service without written authorisation;
bypass rate limits, filters, geographic restrictions or security controls;
use automated scripts, scraping or bots except through an expressly authorised interface;
reverse engineer, extract or attempt to reproduce models, weights, prompts or protected system components;
introduce malware or interfere with another user’s access;
access another Account or data without authorisation;
use multiple Accounts to evade restrictions or enforcement; or
resell, rent or transfer Account access or Credits.
16. Model Training and Competitive Extraction
Unless Dexeric gives prior written permission, you must not use the Service or Outputs at scale to train, fine-tune, distil, benchmark for replication, or improve a competing generative model, nor systematically extract Outputs or functionality for that purpose.
This restriction does not prohibit ordinary analysis, academic commentary or lawful use of individual Outputs, provided it does not involve circumvention or systematic extraction.
17. Enforcement
Dexeric may use automated filters, rate limits, security tools and proportionate human review. Depending on severity, frequency, intent and legal risk, Dexeric may:
block an Input or Output;
warn the user;
restore or decline to restore Credits;
restrict a feature;
require verification;
suspend or terminate an Account;
preserve evidence; or
report conduct to a competent authority or affected service provider.
Credits used in connection with a completed prohibited generation are not refundable merely because enforcement occurs. Mandatory consumer rights remain unaffected.
18. Appeals
If you believe an enforcement decision was incorrect, contact info@dexericai.com and include the Account email, approximate date, relevant generation reference if available, and a concise explanation.
Dexeric may uphold, modify or reverse the decision after review. Repeated, abusive or bad-faith appeals may be limited.
19. Reporting a Violation
Suspected abuse, infringement or unlawful use may be reported through the Website contact form or to info@dexericai.com. Include sufficient detail to identify the issue without sending unnecessary sensitive data.
20. Changes to This Policy
Dexeric may update this AUP to address new risks, technologies, legal requirements or Service features. Material changes will be communicated as required by law.
`);

export const AI_OUTPUT_POLICY = createPolicy('AI Output and Intellectual Property Policy', `
1. Purpose
This AI Output and Intellectual Property Policy explains the relationship between Inputs, Outputs, ownership, commercial use, third-party rights, AI transparency and infringement complaints. It forms part of the Terms of Service.
2. AI-Generated Nature of Outputs
Outputs are generated by artificial intelligence in response to text prompts. AI generation is probabilistic and does not reproduce human creative decision-making in a predictable way.
An Output may contain errors, artefacts, unrealistic details, unintended similarities or elements not requested by the user. Dexeric does not manually approve or verify every Output.
3. Rights in Inputs
You retain the rights you hold in your Input. Submitting an Input does not transfer ownership to Dexeric.
You must have all permissions and lawful grounds necessary to submit the Input and request the intended generation. An Input must not contain protected or confidential material that you are not authorised to use.
You grant Dexeric only the limited processing licence described in the Terms of Service. Dexeric does not use Inputs to train general-purpose AI models.
4. Rights in Outputs
As between you and Dexeric, Dexeric does not claim ownership of your Outputs. To the extent Dexeric acquires any right in an Output, Dexeric assigns that right to you to the fullest extent permitted by applicable law, subject to your compliance with the Terms and Policies.
This allocation governs the contractual relationship between you and Dexeric. It cannot create a copyright or other exclusive right where the law does not recognise one, and it cannot transfer rights belonging to a third party.
5. Commercial Use
You may use Outputs for personal or commercial purposes, including design, advertising, social media, publishing and product materials, provided that the use:
complies with applicable law;
respects third-party rights;
does not violate the Acceptable Use Policy;
does not misrepresent Dexeric’s endorsement; and
includes AI disclosure where required.
Dexeric does not require attribution for ordinary use of an Output. You may state that content was created with Dexeric AI, but you may not imply a partnership, certification or endorsement that does not exist.
6. Copyrightability and Exclusivity
Copyright and related-rights rules for AI-generated content vary by jurisdiction and continue to develop. Factors may include the degree of human authorship, selection, arrangement, editing and creative control.
Dexeric does not guarantee that:
an Output qualifies for copyright or any other exclusive right;
you can register an Output;
the rights are enforceable in every jurisdiction;
another user will not receive a similar or identical Output; or
the Output is free of elements resembling existing material.
If exclusivity is important, obtain legal advice and consider meaningful human editing, clearance and documentation of the creative process.
7. Third-Party Rights
An Output may depict or resemble a person, character, logo, product, artwork, location or other protected subject. Your contractual rights against Dexeric do not eliminate:
copyright or neighbouring rights;
trademark, passing-off or unfair-competition rights;
design or patent rights;
privacy, publicity, image or personality rights;
confidentiality or contractual restrictions; or
laws concerning defamation, advertising, consumer protection or synthetic media.
You are responsible for determining whether permission, a licence, release, disclaimer or other clearance is required before using an Output.
8. Names, Brands and Public Figures
The appearance of a name, brand or public figure in an Input does not mean that the resulting Output is authorised. You must not use an Output to suggest false sponsorship, endorsement, affiliation or an authentic statement by another person.
Commercial use involving a recognisable person, protected brand or distinctive character may require additional permission even where the image itself is AI-generated.
9. No Training on User Content
Dexeric does not use Inputs or Outputs to train its own models or third-party general-purpose AI models. Processing is limited to generation, delivery, security, abuse prevention, support and legal compliance as described in the Terms and Privacy Policy.
10. Privacy and Confidentiality
Generations are private by default and are not placed in a public gallery. However, users should not submit trade secrets, credentials, highly sensitive personal data or information they are not authorised to disclose.
Limited access by authorised processors or personnel may occur for service delivery, support, safety, security, complaints or legal compliance.
11. AI Transparency and Machine-Readable Marking
Where required by applicable law and technically feasible, Dexeric will mark AI-generated or AI-manipulated Outputs in a machine-readable format designed to facilitate detection of their artificial origin. Marking may include metadata, provenance information, Content Credentials, watermarks or another interoperable technical measure.
Technical marking may not be visible in every viewing environment and may be altered by external platforms, screenshots or file conversion. The absence of a visible marker does not mean that an image is human-created.
You must not intentionally remove, falsify or conceal required AI-origin information for the purpose of deception or legal evasion.
12. User Disclosure Duties
You are responsible for visible disclosure where your publication or use triggers a legal or platform requirement. In particular, a realistic AI-generated or manipulated depiction of an identifiable person or event may require clear labelling as synthetic or manipulated content.
Disclosure should be prominent, understandable and appropriate to the medium. A buried statement or inaccessible metadata may be insufficient where visible disclosure is legally required.
13. No Warranty of Clearance
Dexeric does not provide copyright, trademark, publicity or other rights clearance. Automated safeguards are risk-reduction tools and do not constitute a legal opinion or licence.
Before high-value advertising, merchandise, branding, political communication or other sensitive use, you should conduct appropriate review and obtain professional advice.
14. Intellectual Property Complaints
If you believe use of the Service has infringed your intellectual property or other rights, send a notice through the Website contact form or to info@dexericai.com.
A notice should include:
your name and contact details;
identification of the protected work, mark, person or right;
a description of the allegedly infringing activity or Output;
information reasonably sufficient to identify the relevant Account, generation or transaction, if known;
an explanation of your rights and why the use is unauthorised;
a good-faith statement that the information is accurate; and
supporting evidence where reasonably available.
Do not include unnecessary identity documents, complete payment-card data or unrelated personal information.
15. Review and Action
Because Outputs are private and may be distributed outside Dexeric, Dexeric may not be able to remove copies published on third-party services. Within its control, Dexeric may investigate, preserve records, restrict generation, warn or suspend a user, or take another proportionate measure.
Dexeric may request clarification and may share the substance of a complaint with the affected user where necessary for fairness, unless prohibited by law or likely to create a material safety risk.
Submitting a false, misleading or abusive complaint may create legal liability and may result in restriction of access to the complaint process.
16. Repeat or Serious Infringement
Dexeric may suspend or terminate Accounts associated with repeated or serious infringement, taking into account the reliability of notices, the user’s response, the nature of the conduct and applicable law.
17. Changes to This Policy
Dexeric may update this Policy to reflect changes in intellectual-property law, AI regulation, technical marking standards or the Service. Material changes will be communicated where required.
`);

export const LEGAL_NOTICE_POLICY = createPolicy('Legal Notice and Complaints Procedure', `
1. Service Provider
The Dexeric AI Website and Service are operated by:
DEXERIC OÜ
Registry code: 17569201
Registered office: Pärnu mnt 20, Kesklinna linnaosa, 10141 Tallinn, Harju maakond, Estonia
Website: Dexeric AI Website
Email: info@dexericai.com
DEXERIC OÜ is not currently registered for VAT.
2. Electronic Contact
Customer support and legal communications are provided electronically through:
the contact form available on the Website; and
info@dexericai.com.
Dexeric does not provide telephone customer support. Users should retain copies of material correspondence and transaction confirmations.
3. Description of the Service
Dexeric AI is a web-based digital service that generates images from text prompts using artificial intelligence models. Users purchase non-expiring Credits through one-time transactions and spend Credits on successful generations.
The Service is available only to users aged 18 or older and is subject to geographic restrictions stated in the Terms of Service.
4. Contractual Documents
Use of the Service is governed by:
Terms of Service;
Payment, Credits, Digital Delivery and Refund Policy;
Privacy Policy;
Cookie Policy;
Acceptable Use Policy;
AI Output and Intellectual Property Policy; and
this Legal Notice and Complaints Procedure.
The current versions should be available through the Website footer and, where relevant, at registration and checkout.
5. Prices and Proof of Purchase
The final price, currency, Credit package and applicable taxes are displayed before an order is placed. Consumer prices include applicable taxes unless the checkout clearly states otherwise.
After a successful purchase, the user should receive or be able to access an electronic confirmation showing the trader, transaction date, package and total amount paid.
6. Submitting a Complaint
A complaint may be submitted through the Website contact form or to info@dexericai.com. To help Dexeric investigate, include:
your name and Account email;
the date of purchase or incident;
the order, transaction or generation reference, if available;
a clear description of the issue;
the resolution requested; and
relevant supporting documents or screenshots.
Do not send passwords, authentication codes, complete card numbers or card security codes.
7. Complaint Handling
Dexeric will acknowledge and investigate complaints in good faith. A written consumer complaint will receive a written response within 15 days as required by applicable Estonian consumer rules. If more information is required, Dexeric may request it promptly.
The response will state Dexeric’s position and, where appropriate, a proposed remedy or an explanation of why the requested remedy cannot be provided.
Submitting a complaint does not suspend an undisputed payment obligation, but it does not limit any mandatory consumer or payment rights.
8. Available Remedies
Depending on the issue and applicable law, a remedy may include:
correction of an Account or Credit balance;
restoration of Credits;
repeat digital performance where appropriate;
repair of a technical defect;
price reduction;
full or partial refund;
Account or security assistance; or
another legally required remedy.
Creative dissatisfaction with a successfully generated Output is not by itself a technical defect. Statutory conformity rights remain unaffected.
9. Consumer Disputes Committee
If an eligible consumer and Dexeric cannot resolve a dispute after the consumer has first submitted a complaint to Dexeric, the consumer may apply to the Consumer Disputes Committee operating at the Estonian Consumer Protection and Technical Regulatory Authority.
Information and submission instructions are available on the Consumer Disputes Committee website.
The Committee generally handles disputes between a consumer resident in Estonia and a trader registered in Estonia. Consumers in another EU or EEA country may contact their local European Consumer Centre or another competent alternative-dispute-resolution body for guidance.
10. Courts and Applicable Law
The contractual relationship is governed by Estonian law, without depriving a consumer of mandatory protections available in the country of habitual residence.
Business disputes are subject to the competent courts of Estonia. Consumers may use any court or dispute forum available under mandatory jurisdiction and consumer-protection rules.
11. Intellectual Property and Abuse Reports
Reports concerning infringement, impersonation, illegal content or misuse should be sent through the Website contact form or to info@dexericai.com. Intellectual-property notices should contain the information listed in the AI Output and Intellectual Property Policy.
12. Privacy Requests
Requests concerning access, correction, deletion, objection or other data-protection rights may be sent to info@dexericai.com. Details are provided in the Privacy Policy.
13. Accessibility
Dexeric aims to make the Website, checkout and customer-support channels perceivable, operable, understandable and robust. Accessibility concerns may be reported through the Website contact form or to info@dexericai.com.
Where accessibility law requires specific service information or a formal accessibility statement, Dexeric will publish and maintain that information. Any applicable microenterprise exemption will be assessed using the company’s actual employee and financial data rather than assumed.
14. Policy Languages
The controlling version of the contractual Policies should be identified on the Website. If Dexeric publishes a translation, the translation should be accurate and accessible. A language-priority clause does not override mandatory consumer information requirements in a user’s jurisdiction.
15. Updates
Dexeric may update this Legal Notice and Complaints Procedure when company information, support channels, dispute processes or legal requirements change. The current version will display a revised date.
`);

export const COOKIE_POLICY = createPolicy('Cookie Policy', `
1. Purpose of This Policy
This Cookie Policy explains how DEXERIC OÜ uses cookies and similar technologies on the Dexeric AI Website and in the Dexeric AI Service. It should be read together with the Privacy Policy.
2. What Cookies Are
Cookies are small text files stored on a browser or device when a website is visited. Cookies can remember a session, authenticate a user, store preferences, support security, measure performance or help understand how a service is used.
Similar technologies may include local storage, software development kit identifiers, pixels, tags and device identifiers. References to “cookies” in this Policy include similar technologies where appropriate.
3. Legal Basis and Consent
Strictly necessary cookies may be used without consent where they are required to transmit communications, secure the Website or provide a feature expressly requested by the user.
Analytics, advertising and other non-essential cookies will be used only after consent where consent is required. Consent must be freely given, specific, informed and unambiguous. Rejecting optional cookies must be as easy as accepting them.
Optional cookies will remain disabled until the relevant consent is recorded. Withdrawing consent does not affect processing that occurred lawfully before withdrawal.
4. Categories of Cookies
4.1 Strictly Necessary Cookies
These cookies support functions such as:
Account login and session continuity;
fraud and security protection;
load balancing and network delivery;
Credit balance and checkout continuity;
remembering privacy choices; and
other functionality necessary to provide the Service requested by the user.
Strictly necessary cookies cannot be disabled through the Dexeric cookie settings where doing so would prevent the requested function. They may still be removed through browser settings, although the Service may then stop working correctly.
4.2 Functional Cookies
Functional cookies remember optional preferences such as language, display settings or other customisation. Where these cookies are not strictly necessary, they are used only with the consent required by applicable law.
4.3 Analytics and Performance Cookies
Analytics cookies help Dexeric understand aggregate Website traffic, feature usage, errors and performance. They may collect page views, interaction events, device information, approximate location and cookie identifiers.
Analytics cookies are used only if deployed and only after consent where required.
4.4 Advertising Cookies
Advertising cookies may be used to measure campaigns, limit repetition or personalise advertising. Dexeric does not currently use personal data for cross-context behavioural advertising without the consent or opt-out mechanism required by applicable law.
If advertising cookies are introduced, the cookie banner and settings tool will be updated before they are activated.
5. First-Party and Third-Party Cookies
First-party cookies are set by Dexeric. Third-party cookies are set or accessed by a provider whose functionality is embedded in or connected to the Website, such as a payment, analytics, authentication, security or content-delivery provider.
Third-party providers may process information under their own terms and privacy notices. Dexeric will identify applicable third parties in the cookie settings tool where required.
6. Cookie Inventory
The current cookie settings tool should display, for each cookie or technology where reasonably practicable:
name;
provider;
category;
purpose;
duration; and
whether it is first-party or third-party.
Because the technical configuration may change, the cookie settings tool is the authoritative current inventory. This Policy describes the governing categories and rules. Dexeric must update the inventory when providers or cookies materially change.
7. Cookie Duration
Session cookies expire when the browser session ends. Persistent cookies remain until their stated expiry date or until they are removed.
Dexeric will not retain a cookie longer than reasonably necessary for its stated purpose. The applicable duration for each active cookie should be displayed in the cookie settings tool.
8. Managing Cookie Choices
You can manage optional cookies through the cookie banner or the “Cookie Settings” link available on the Website. You can accept or reject categories and later change your choice.
You may also delete or block cookies using browser settings. Browser controls vary by provider. Blocking all cookies may prevent login, checkout, security or other essential functions.
9. Do Not Track and Similar Signals
Browsers and devices may offer “Do Not Track”, Global Privacy Control or similar signals. Where applicable law requires recognition of a supported signal, Dexeric will process it accordingly. Otherwise, the cookie settings tool remains the primary method for recording Website cookie choices.
10. Updates to This Policy
Dexeric may update this Cookie Policy when technologies, providers or legal requirements change. The revised version will display an updated date. Where a new purpose requires consent, Dexeric will request consent before activating the relevant technology.
11. Contact
Questions about cookies may be sent through the Website contact form or to info@dexericai.com.
`);
