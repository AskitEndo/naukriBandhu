"use client";
import { motion } from "framer-motion";
import Image from "next/image";

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({
  message = "Loading...",
}: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-cyan-50 to-blue-100 flex items-center justify-center z-50">
      <div className="text-center">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="mb-6"
        >
          <Image
            src="/logo.gif"
            alt="Naukri Bandu Loading"
            width={120}
            height={120}
            className="mx-auto"
            unoptimized
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-cyan-800 mb-2">
            Naukri Bandu
          </h2>
          <p className="text-gray-600">{message}</p>
        </motion.div>

        {/* Loading dots */}
        <div className="flex justify-center space-x-1 mt-4">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-2 h-2 bg-cyan-500 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: index * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
