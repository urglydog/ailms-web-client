import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { cartList, wishlistList, enrollList } = vi.hoisted(() => ({
  cartList: vi.fn().mockResolvedValue([]),
  wishlistList: vi.fn().mockResolvedValue([]),
  enrollList: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/lib/api/cart', () => ({ cartApi: { list: cartList } }));
vi.mock('@/lib/api/wishlist', () => ({ wishlistApi: { list: wishlistList } }));
vi.mock('@/lib/api/enrollments', () => ({ enrollmentsApi: { listMine: enrollList } }));

import { useCart } from './useCart';
import { useWishlist } from './useWishlist';
import { useMyEnrollments } from './useEnrollments';
import { useMyEnrollments as useMyEnrollmentsForCart } from './useCartBundleMatches';

function login(roles: string) {
  const payload = btoa(JSON.stringify({ sub: 'a@b.c', id: 1, roles, exp: 9999999999 }));
  localStorage.setItem('accessToken', `h.${payload}.s`);
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('hook dành cho học viên', () => {
  it('ADMIN: không gọi /cart, /wishlist, /enrollments/mine', async () => {
    login('ROLE_ADMIN');
    renderHook(() => { useCart(); useWishlist(); useMyEnrollments(); useMyEnrollmentsForCart(); }, { wrapper });
    await new Promise((r) => setTimeout(r, 30));
    expect(cartList).not.toHaveBeenCalled();
    expect(wishlistList).not.toHaveBeenCalled();
    expect(enrollList).not.toHaveBeenCalled();
  });

  it('STUDENT: vẫn gọi bình thường', async () => {
    login('ROLE_STUDENT');
    renderHook(() => { useCart(); useWishlist(); useMyEnrollments(); }, { wrapper });
    await waitFor(() => {
      expect(cartList).toHaveBeenCalled();
      expect(wishlistList).toHaveBeenCalled();
      expect(enrollList).toHaveBeenCalled();
    });
  });
});
