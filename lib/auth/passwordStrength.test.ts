import { describe, expect, it } from 'vitest';
import { passwordStrength } from './passwordStrength';

describe('passwordStrength', () => {
  it('rỗng thì điểm 0', () => {
    expect(passwordStrength('')).toEqual({ score: 0, level: 'empty' });
  });
  it('dưới 6 ký tự là quá ngắn', () => {
    expect(passwordStrength('ab1')).toEqual({ score: 1, level: 'short' });
  });
  it('đủ dài nhưng thiếu chữ hoặc số là yếu', () => {
    expect(passwordStrength('abcdefgh')).toEqual({ score: 2, level: 'weak' });
    expect(passwordStrength('12345678')).toEqual({ score: 2, level: 'weak' });
  });
  it('có cả chữ và số là tốt', () => {
    expect(passwordStrength('abc12345')).toEqual({ score: 3, level: 'good' });
  });
  it('có chữ, số, ký tự đặc biệt và từ 8 ký tự là mạnh', () => {
    expect(passwordStrength('Abc12345!')).toEqual({ score: 4, level: 'strong' });
  });
  it('có chữ, số, ký tự đặc biệt nhưng dưới 8 ký tự vẫn chỉ là tốt', () => {
    expect(passwordStrength('Ab1!xy')).toEqual({ score: 3, level: 'good' });
  });
});
