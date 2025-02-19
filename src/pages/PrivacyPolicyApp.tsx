export function PrivacyPolicyApp() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Mobile App Privacy Policy</h1>
      
      <div className="prose prose-invert">
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h2>1. Introduction</h2>
        <p>
          This Privacy Policy covers the Hooked on Flies mobile application.
        </p>

        <h2>2. Information We Collect</h2>
        <h3>2.1 Camera Usage</h3>
        <p>
          Our app requests camera access to:
        </p>
        <ul>
          <li>Take photos of flies for identification</li>
          <li>Upload images to your fly collection</li>
        </ul>
        <p>
          Photos taken through the app are uploaded to our secure cloud storage. These 
          images may be used to improve our fly identification service and for marketing 
          purposes.
        </p>

        <h2>3. Data Storage and Security</h2>
        <ul>
          <li>Images are stored temporarily on your device during upload</li>
          <li>All images are stored in our secure cloud storage (Supabase)</li>
          <li>We never access your camera without your permission</li>
          <li>Your images may be used for service improvement and marketing</li>
        </ul>

        <h2>4. Advertising and Marketing</h2>
        <p>
          By using our app, you understand that:
        </p>
        <ul>
          <li>Your usage data may be used for personalized advertising</li>
          <li>We may analyze your preferences to recommend products</li>
          <li>Your data helps us improve our fly identification service</li>
          <li>We may share non-personal, aggregated data with partners</li>
        </ul>

        <h2>5. Your Rights</h2>
        <p>
          You can:
        </p>
        <ul>
          <li>Revoke camera permissions at any time</li>
          <li>Request deletion of your uploaded images</li>
          <li>Opt-out of personalized advertising</li>
          <li>Export your data</li>
        </ul>

        <h2>6. Contact Us</h2>
        <p>
          For questions about this policy: support@hookedonflies.app
        </p>
      </div>
    </div>
  );
} 