interface FooterProps {
  onAdminClick?: () => void;
}

export function Footer({ onAdminClick }: FooterProps) {
  return (
    <footer className="bg-gray-900/80 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Hooked on Flies</h3>
            <p className="text-gray-400 text-sm">
              Your intelligent fly fishing companion
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a href="/privacy" className="text-gray-400 hover:text-white text-sm">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/privacy-app" className="text-gray-400 hover:text-white text-sm">
                  Mobile App Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-gray-400 hover:text-white text-sm">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/cookies" className="text-gray-400 hover:text-white text-sm">
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="/deletemydata" className="text-gray-400 hover:text-white text-sm">
                  Delete My Data
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <p className="text-gray-400 text-sm">
              Email: support@hookedonflies.app
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex justify-between items-center">
            <p className="text-center text-gray-400 text-sm">
              © {new Date().getFullYear()} Hooked on Flies. All rights reserved.
            </p>
            <button
              onClick={onAdminClick}
              className="text-gray-400 hover:text-white text-sm"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
} 