import React from 'react';

const ExternalLink = ({ href, children }) => {
  return (
    <a
      href={href}
      className="group relative font-medium transition text-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
    >
      {children}
      {/* เส้นใต้แบบ animate + แสดงเต็มเมื่อ hover */}
      <span
        className="absolute left-0 -bottom-1 h-0.5 bg-blue-600 transition-all w-0 group-hover:w-full"
      />
    </a>
  );
};

export default ExternalLink;