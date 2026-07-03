/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 הוא מודול נייטיב — יש להשאיר אותו חיצוני לבנדל של השרת
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
