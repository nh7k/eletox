import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../useAuthStore';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';

// Mock the dependencies
jest.mock('../../lib/axios');
jest.mock('react-hot-toast');
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
  })),
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset the store state
    act(() => {
      useAuthStore.getState().authUser = null;
    });
  });

  describe('signup', () => {
    it('should handle successful signup', async () => {
      const mockUser = { _id: '123', username: 'testuser' };
      axiosInstance.post.mockResolvedValueOnce({ data: mockUser });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signup({ username: 'testuser', password: 'password' });
      });

      expect(result.current.authUser).toEqual(mockUser);
      expect(result.current.isSigningUp).toBe(false);
      expect(toast.success).toHaveBeenCalledWith('Account created successfully');
    });

    it('should handle signup error', async () => {
      const errorMessage = 'Username already exists';
      axiosInstance.post.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signup({ username: 'testuser', password: 'password' });
      });

      expect(result.current.authUser).toBeNull();
      expect(result.current.isSigningUp).toBe(false);
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });

    it('should handle network error during signup', async () => {
      axiosInstance.post.mockRejectedValueOnce(new Error('Network Error'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signup({ username: 'testuser', password: 'password' });
      });

      expect(result.current.authUser).toBeNull();
      expect(result.current.isSigningUp).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Network Error');
    });

    it('should handle empty response during signup', async () => {
      axiosInstance.post.mockResolvedValueOnce({});

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signup({ username: 'testuser', password: 'password' });
      });

      expect(result.current.authUser).toBeNull();
      expect(result.current.isSigningUp).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Invalid response from server');
    });
  });

  describe('login', () => {
    it('should handle successful login', async () => {
      const mockUser = { _id: '123', username: 'testuser' };
      axiosInstance.post.mockResolvedValueOnce({ data: mockUser });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({ username: 'testuser', password: 'password' });
      });

      expect(result.current.authUser).toEqual(mockUser);
      expect(result.current.isLoggingIn).toBe(false);
      expect(toast.success).toHaveBeenCalledWith('Logged in successfully');
    });

    it('should handle login error', async () => {
      const errorMessage = 'Invalid credentials';
      axiosInstance.post.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({ username: 'testuser', password: 'wrongpassword' });
      });

      expect(result.current.authUser).toBeNull();
      expect(result.current.isLoggingIn).toBe(false);
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });

    it('should handle network error during login', async () => {
      axiosInstance.post.mockRejectedValueOnce(new Error('Network Error'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({ username: 'testuser', password: 'password' });
      });

      expect(result.current.authUser).toBeNull();
      expect(result.current.isLoggingIn).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Network Error');
    });
  });

  describe('logout', () => {
    it('should handle successful logout', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      // Set initial auth state
      act(() => {
        result.current.authUser = { _id: '123', username: 'testuser' };
      });

      axiosInstance.post.mockResolvedValueOnce({});

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.authUser).toBeNull();
      expect(toast.success).toHaveBeenCalledWith('Logged out successfully');
    });

    it('should handle logout error', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.authUser = { _id: '123', username: 'testuser' };
      });

      const errorMessage = 'Failed to logout';
      axiosInstance.post.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.authUser).toBeNull();
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('checkAuth', () => {
    it('should handle successful auth check', async () => {
      const mockUser = { _id: '123', username: 'testuser' };
      axiosInstance.get.mockResolvedValueOnce({ data: mockUser });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.authUser).toEqual(mockUser);
      expect(result.current.isCheckingAuth).toBe(false);
    });

    it('should handle failed auth check', async () => {
      axiosInstance.get.mockRejectedValueOnce(new Error('Not authenticated'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.authUser).toBeNull();
      expect(result.current.isCheckingAuth).toBe(false);
    });

    it('should handle network error during auth check', async () => {
      axiosInstance.get.mockRejectedValueOnce(new Error('Network Error'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.authUser).toBeNull();
      expect(result.current.isCheckingAuth).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('should handle successful profile update', async () => {
      const mockUser = { _id: '123', username: 'updateduser' };
      axiosInstance.put.mockResolvedValueOnce({ data: mockUser });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.updateProfile({ username: 'updateduser' });
      });

      expect(result.current.authUser).toEqual(mockUser);
      expect(result.current.isUpdatingProfile).toBe(false);
      expect(toast.success).toHaveBeenCalledWith('Profile updated successfully');
    });

    it('should handle profile update error', async () => {
      const errorMessage = 'Username already taken';
      axiosInstance.put.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.updateProfile({ username: 'takenusername' });
      });

      expect(result.current.isUpdatingProfile).toBe(false);
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });
}); 