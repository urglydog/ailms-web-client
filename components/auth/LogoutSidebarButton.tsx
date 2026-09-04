'use client';

import React, { useState } from 'react';

export function LogoutSidebarButton() {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="mt-4 px-2 text-left text-xs font-semibold text-red-400 no-underline hover:text-red-300 w-full flex items-center gap-2"
      >
        <span>🚪</span> Đăng xuất
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-white">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <span className="text-2xl">⚠️</span>
              <h3 className="font-bold text-base text-white">Xác nhận đăng xuất</h3>
            </div>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleLogout}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-red-500 transition-all"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

