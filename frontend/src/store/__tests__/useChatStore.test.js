import { renderHook, act } from '@testing-library/react';
import { useChatStore } from '../useChatStore';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';

// Mock the dependencies
jest.mock('../../lib/axios');
jest.mock('react-hot-toast');

describe('useChatStore', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset the store state
    act(() => {
      useChatStore.getState().messages = [];
      useChatStore.getState().selectedChat = null;
    });
  });

  describe('sendMessage', () => {
    it('should handle successful message sending', async () => {
      const mockMessage = {
        _id: '123',
        content: 'Hello',
        sender: 'user123',
        chat: 'chat123',
        createdAt: new Date().toISOString()
      };

      axiosInstance.post.mockResolvedValueOnce({ data: mockMessage });

      const { result } = renderHook(() => useChatStore());

      await act(async () => {
        await result.current.sendMessage('chat123', 'Hello');
      });

      expect(result.current.messages).toContainEqual(mockMessage);
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should handle message sending error', async () => {
      const errorMessage = 'Failed to send message';
      axiosInstance.post.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      const { result } = renderHook(() => useChatStore());

      await act(async () => {
        await result.current.sendMessage('chat123', 'Hello');
      });

      expect(result.current.messages).toHaveLength(0);
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('getMessages', () => {
    it('should fetch messages successfully', async () => {
      const mockMessages = [
        {
          _id: '123',
          content: 'Hello',
          sender: 'user123',
          chat: 'chat123',
          createdAt: new Date().toISOString()
        }
      ];

      axiosInstance.get.mockResolvedValueOnce({ data: mockMessages });

      const { result } = renderHook(() => useChatStore());

      await act(async () => {
        await result.current.getMessages('chat123');
      });

      expect(result.current.messages).toEqual(mockMessages);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle message fetching error', async () => {
      const errorMessage = 'Failed to fetch messages';
      axiosInstance.get.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      const { result } = renderHook(() => useChatStore());

      await act(async () => {
        await result.current.getMessages('chat123');
      });

      expect(result.current.messages).toHaveLength(0);
      expect(result.current.isLoading).toBe(false);
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('selectChat', () => {
    it('should select a chat and fetch its messages', async () => {
      const mockChat = { _id: 'chat123', name: 'Test Chat' };
      const mockMessages = [
        {
          _id: '123',
          content: 'Hello',
          sender: 'user123',
          chat: 'chat123',
          createdAt: new Date().toISOString()
        }
      ];

      axiosInstance.get.mockResolvedValueOnce({ data: mockMessages });

      const { result } = renderHook(() => useChatStore());

      await act(async () => {
        await result.current.selectChat(mockChat);
      });

      expect(result.current.selectedChat).toEqual(mockChat);
      expect(result.current.messages).toEqual(mockMessages);
    });
  });
}); 