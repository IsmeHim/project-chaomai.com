import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function useIsActive(path, { exact = false } = {}) {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/+$/, '');
  const base = path.replace(/\/+$/, '');
  if (exact) return pathname === base;
  return pathname === base || pathname.startsWith(base + '/');
}

const ExternalLink = ({ href, children, exact }) => {
  const active = useIsActive(href, { exact });

  return (
    <Link
      to={href}
      className={`group relative font-medium transition ${
        active ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
      }`}
    >
      {children}
      <span
        className={`absolute left-0 -bottom-1 h-0.5 bg-blue-600 transition-all ${
          active ? 'w-full' : 'w-0 group-hover:w-full'
        }`}
      />
    </Link>
  );
};

export default ExternalLink;
