export function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
      
      <div className="prose prose-invert">
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h2>1. Introduction</h2>
        <p>
          Welcome to Hooked on Flies. This Privacy Policy explains how we collect, use, 
          disclose, and safeguard your information when you visit our website hookedonflies.app.
        </p>

        <h2>2. Information We Collect</h2>
        <h3>2.1 Personal Information</h3>
        <ul>
          <li>Email address (when joining our waitlist)</li>
          <li>Name (optional)</li>
          <li>Usage data and analytics</li>
          <li>Photos and images you upload</li>
          <li>Fly fishing preferences and activity data</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>To provide and maintain our Service</li>
          <li>To notify you about changes to our Service</li>
          <li>To provide customer support</li>
          <li>To gather analysis or valuable information to improve our Service</li>
          <li>To provide personalized advertising and product recommendations</li>
          <li>To analyze usage patterns for service improvement</li>
        </ul>

        <h2>4. Data Storage</h2>
        <p>
          We use Supabase for our database and file storage needs. All uploaded images 
          and data are stored in secure cloud storage buckets. Your data is stored 
          securely and in accordance with their security standards.
        </p>

        <h2>5. Advertising and Marketing</h2>
        <p>
          We may use your data to:
        </p>
        <ul>
          <li>Show you personalized advertisements</li>
          <li>Recommend fishing-related products</li>
          <li>Analyze fishing preferences for marketing purposes</li>
          <li>Share aggregated, non-personal data with advertising partners</li>
        </ul>

        <h2>6. Analytics</h2>
        <p>
          We use Google Analytics to understand how our website is being used. This 
          service may collect information such as your IP address, browser type, and 
          pages visited.
        </p>

        <h2>7. Your Rights</h2>
        <p>
          You have the right to:
        </p>
        <ul>
          <li>Access your personal data</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Withdraw consent at any time</li>
        </ul>

        <h2>8. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at:
          support@hookedonflies.app
        </p>
      </div>
    </div>
  );
} 