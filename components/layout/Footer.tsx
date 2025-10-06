"use client";

import { motion } from "framer-motion";
import { 
  FaFacebookF, 
  FaTiktok, 
  FaInstagram,
} from "react-icons/fa";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

const Footer = () => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogoClick = () => {
    if (pathname !== "/") {
      router.push("/");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Data sosial media dengan nama platform yang jelas
  const socialMedia = [
    { 
      icon: FaTiktok, 
      href: "https://www.tiktok.com/@",
      color: "hover:bg-black hover:text-white",
      bg: "bg-black",
      name: "TikTok"
    },
    { 
      icon: FaInstagram, 
      href: "https://www.instagram.com/",
      color: "hover:bg-pink-600 hover:text-white",
      bg: "bg-gradient-to-r from-purple-500 to-pink-500",
      name: "Instagram"
    },
  ];

  return (
    <footer className="footer-container pt-8 bg-white text-gray-800">
      {/* Bagian konten footer */}
      <div className="w-full">
        <div className="px-6 md:px-12 lg:px-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6 items-start">
            {/* Kolom 1: Logo dan Deskripsi */}
            <div className="space-y-4">
              <div
                className="cursor-pointer flex items-center gap-2"
                onClick={handleLogoClick}
              >
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">NS</span>
                </div>
                <div>
                  <h1 className="text-gray-800 text-xl font-semibold">NIKHU STUDIO</h1>
                  <p className="text-gray-600 text-xs">More Than Just Pictures</p>
                </div>
              </div>
              <p className="text-gray-600">
                Creative, Stunning, and Memorable Photography
              </p>
            </div>

            {/* Kolom 3: Follow Us */}
            <div className="space-y-4 text-left md:text-right md:ml-auto order-last md:order-none">
              <h4 className="text-lg font-semibold mb-2 text-gray-800">Follow Us</h4>
              <div className="flex justify-start md:justify-end space-x-3">
                {socialMedia.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-3 rounded-full text-white transition-all duration-300 flex items-center justify-center ${social.bg} ${social.color}`}
                    style={{ width: "44px", height: "44px" }}
                    aria-label={`Follow us on ${social.name}`}
                  >
                    <social.icon className="w-5 h-5" />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Copyright */}
      <div className="bg-gray-100 pt-4 pb-4 w-full">
        <div className="px-6 md:px-12 lg:px-20">
          <div className="flex justify-center items-center w-full">
            <p className="text-center text-sm text-gray-600">
              © {new Date().getFullYear()} Naka Studio. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;