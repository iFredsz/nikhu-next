"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Send, Clock } from "lucide-react";
import emailjs from "@emailjs/browser";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Email is invalid";
      isValid = false;
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Fungsi escape HTML agar simbol tidak corrupt
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;

      if (!serviceId || !templateId || !publicKey) {
        throw new Error("Missing EmailJS environment variables");
      }

      const templateParams = {
        name: escapeHtml(formData.name),
        email: escapeHtml(formData.email),
        subject: escapeHtml(formData.subject),
        message: escapeHtml(formData.message),
      };

      const result = await emailjs.send(
        serviceId,
        templateId,
        templateParams,
        publicKey
      );

      if (result.status === 200) {
        toast.success("Pesan berhasil dikirim!");
        setFormData({ name: "", email: "", subject: "", message: "" });
        setErrors({});
      } else {
        toast.error("Gagal mengirim pesan. Silakan coba lagi.");
      }
    } catch (error: any) {
      console.error("EmailJS Error:", error);
      toast.error("Terjadi kesalahan saat mengirim pesan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openGoogleMaps = () => {
    window.open("https://maps.app.goo.gl/Hg59sf1Gp6NGAYie8?g_st=ipc", "_blank");
  };

  return (
    <section id="contact" className="py-12 md:py-12 relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-gray-900">
            Yuk Membangun Sesuatu yang Luar Biasa
          </h2>
          <p className="text-gray-700 max-w-2xl mx-auto text-sm md:text-base">
            Ingin tanya sesuatu atau berdiskusi mengenai kolaborasi? Kirimkan
            pesan kepada kami, dan kami akan merespons dalam 24 jam.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
          {/* Info Contact */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 md:space-y-8"
          >
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800">
                Detail Kontak Kami
              </h3>

              <div className="space-y-3 md:space-y-4">
                {[
                  {
                    icon: Phone,
                    text: "+62 857-0226-2321",
                    href: "https://wa.me/+6285702262321",
                    description: "Senin-Jumat, 09.00-19.00",
                  },
                  {
                    icon: Mail,
                    text: "nikhustudio@gmail.com",
                    href: "mailto:nikhustudio@gmail.com",
                    description: "Balasan dalam 24 jam",
                  },
                  {
                    icon: MapPin,
                    text: "Kota Salatiga",
                    onClick: openGoogleMaps,
                    description: "Jawa Tengah, 50715",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ y: -2 }}
                    className={`flex items-start gap-3 p-3 md:p-4 rounded-lg md:rounded-xl bg-white border hover:border-amber-300 transition-all cursor-pointer ${
                      item.href || item.onClick ? "group hover:bg-amber-50" : ""
                    }`}
                    onClick={() => {
                      if (item.href) window.open(item.href, "_blank");
                      if (item.onClick) item.onClick();
                    }}
                  >
                    <div className="p-2 md:p-2.5 rounded-md md:rounded-lg bg-amber-300/20 text-amber-700">
                      <item.icon className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div className="flex-1">
                      <span className="text-gray-800 text-sm md:text-base font-medium block group-hover:text-amber-600 transition-colors">
                        {item.text}
                      </span>
                      <p className="text-gray-600 text-xs md:text-sm mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Office Hours */}
            <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl border shadow-sm">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4">
                Email Customer Service
              </h3>
              <div className="space-y-2 md:space-y-3">
                {[
                  { days: "Senin - Jumat", time: "09.00 - 18.00 WIB", icon: Clock },
                  { days: "Sabtu", time: "10.00 - 14.00 WIB", icon: Clock },
                  { days: "Minggu", time: "09.00 - 12.00 WIB", icon: Clock },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 py-2 md:py-2.5">
                    <div className="p-1.5 md:p-2 rounded-md md:rounded-lg bg-amber-300/20 text-amber-700">
                      <item.icon className="w-3 h-3 md:w-4 md:h-4" />
                    </div>
                    <div className="flex-1 flex justify-between items-center">
                      <span className="text-gray-800 text-sm md:text-base font-medium">
                        {item.days}
                      </span>
                      <span className="text-gray-700 text-xs md:text-sm font-medium">
                        {item.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.form
            initial={{ x: 50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            onSubmit={handleSubmit}
            className="bg-white p-6 md:p-8 rounded-xl shadow-lg border"
          >
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">
              Kirim Pesan
            </h3>

            <div className="space-y-4 md:space-y-5">
              <div className="grid md:grid-cols-2 gap-4 md:gap-5">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                    Nama *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nama Anda"
                    className={`w-full px-3 py-2 md:px-4 md:py-2.5 rounded-lg border ${
                      errors.name
                        ? "border-red-300 focus:ring-red-200"
                        : "border-gray-300 focus:ring-amber-300"
                    } focus:ring-2 focus:outline-none transition-all bg-white text-gray-900 placeholder-gray-400 text-sm md:text-base`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@domain.com"
                    className={`w-full px-3 py-2 md:px-4 md:py-2.5 rounded-lg border ${
                      errors.email
                        ? "border-red-300 focus:ring-red-200"
                        : "border-gray-300 focus:ring-amber-300"
                    } focus:ring-2 focus:outline-none transition-all bg-white text-gray-900 placeholder-gray-400 text-sm md:text-base`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Subjek
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Subjek pesan Anda"
                  className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-300 focus:outline-none transition-all bg-white text-gray-900 placeholder-gray-400 text-sm md:text-base"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Pesan *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Ceritakan proyek atau pertanyaan Anda..."
                  className={`w-full px-3 py-2 md:px-4 md:py-2.5 rounded-lg border ${
                    errors.message
                      ? "border-red-300 focus:ring-red-200"
                      : "border-gray-300 focus:ring-amber-300"
                  } focus:ring-2 focus:outline-none transition-all bg-white text-gray-900 placeholder-gray-400 text-sm md:text-base`}
                ></textarea>
                {errors.message && (
                  <p className="mt-1 text-xs text-red-500">{errors.message}</p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-4 py-3 md:px-6 md:py-3.5 bg-amber-400 hover:bg-amber-500 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all duration-300 ease-in-out shadow-lg hover:shadow-amber-500/30 disabled:opacity-70 disabled:cursor-not-allowed text-sm md:text-base"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 md:h-5 md:w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Mengirim...
                  </>
                ) : (
                  <>
                    <span>Kirim Pesan</span>
                    <Send className="w-3 h-3 md:w-4 md:h-4" />
                  </>
                )}
              </motion.button>
            </div>
          </motion.form>
        </div>
      </div>
    </section>
  );
}
