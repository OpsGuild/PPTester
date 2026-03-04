# Privacy Policy

**Effective Date:** March 4, 2026
**App:** PPTester — Pi Payment Tester
**URL:** [https://pptester.netlify.app](https://pptester.netlify.app)

---

## 1. Data We Collect

PPTester is a **client-side only** application. We do not operate a backend server and do not collect, store, or transmit any personal data to our own servers.

When you use PPTester, the following data is handled **locally in your browser**:

- **Pi Network authentication data** — username and UID provided by the Pi SDK during authentication. This data stays in your browser session and is not persisted or sent anywhere by us.
- **Configuration data** — backend URLs, access tokens, endpoint settings, and saved configs are stored in your browser's `localStorage`. This data never leaves your device.
- **Payment flow data** — payment references, Pi Payment IDs, and transaction IDs generated during payment testing are displayed in the UI and logged locally. They are not transmitted to any server other than the backend you explicitly configure.

## 2. Third-Party Services

- **Pi Network SDK** — PPTester loads the Pi SDK from `sdk.minepi.com`. Your interaction with Pi Network is governed by [Pi Network's Privacy Policy](https://minepi.com/privacy).
- **Your Backend API** — All API requests go to the backend URL you configure. We have no control over and assume no responsibility for the data handling practices of your backend.

## 3. Cookies and Tracking

We do not use cookies, analytics, tracking pixels, or any third-party tracking tools.

## 4. Data Storage

All data is stored in your browser's `localStorage`. You can clear it at any time via your browser settings or by deleting saved configs within the app.

## 5. Data Sharing

We do not share, sell, or distribute any user data. We have no access to your data.

## 6. Children's Privacy

PPTester is not directed at children under 13. We do not knowingly collect data from children.

## 7. Changes to This Policy

We may update this policy from time to time. Changes will be reflected by updating the effective date above.

## 8. Contact

For questions about this privacy policy, open an issue on the [GitHub repository](https://github.com/OpsGuild/PPTester).
