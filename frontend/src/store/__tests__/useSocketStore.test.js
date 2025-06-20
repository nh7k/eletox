import { renderHook, act } from '@testing-library/react';
import { useSocketStore } from '../useSocketStore';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    emit: jest.fn(),
  })),
}));

describe('useSocketStore', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset the store state
    act(() => {
      useSocketStore.getState().socket = null;
      useSocketStore.getState().onlineUsers = [];
    });
  });

  describe('connectSocket', () => {
    it('should connect to socket server', () => {
      const { result } = renderHook(() => useSocketStore());
      const mockSocket = {
        connect: jest.fn(),
        on: jest.fn(),
      };

      io.mockReturnValueOnce(mockSocket);

      act(() => {
        result.current.connectSocket('user123');
      });

      expect(io).toHaveBeenCalledWith(expect.any(String), {
        query: { userId: 'user123' },
      });
      expect(mockSocket.connect).toHaveBeenCalled();
      expect(result.current.socket).toBe(mockSocket);
    });

    it('should not connect if already connected', () => {
      const { result } = renderHook(() => useSocketStore());
      const mockSocket = {
        connect: jest.fn(),
        on: jest.fn(),
        connected: true,
      };

      act(() => {
        result.current.socket = mockSocket;
      });

      act(() => {
        result.current.connectSocket('user123');
      });

      expect(io).not.toHaveBeenCalled();
      expect(mockSocket.connect).not.toHaveBeenCalled();
    });
  });

  describe('disconnectSocket', () => {
    it('should disconnect from socket server', () => {
      const { result } = renderHook(() => useSocketStore());
      const mockSocket = {
        disconnect: jest.fn(),
        connected: true,
      };

      act(() => {
        result.current.socket = mockSocket;
      });

      act(() => {
        result.current.disconnectSocket();
      });

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should not disconnect if not connected', () => {
      const { result } = renderHook(() => useSocketStore());
      const mockSocket = {
        disconnect: jest.fn(),
        connected: false,
      };

      act(() => {
        result.current.socket = mockSocket;
      });

      act(() => {
        result.current.disconnectSocket();
      });

      expect(mockSocket.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('should emit message through socket', () => {
      const { result } = renderHook(() => useSocketStore());
      const mockSocket = {
        emit: jest.fn(),
        connected: true,
      };

      act(() => {
        result.current.socket = mockSocket;
      });

      const message = {
        content: 'Hello',
        chatId: 'chat123',
        sender: 'user123',
      };

      act(() => {
        result.current.sendMessage(message);
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('new message', message);
    });

    it('should not emit message if socket is not connected', () => {
      const { result } = renderHook(() => useSocketStore());
      const mockSocket = {
        emit: jest.fn(),
        connected: false,
      };

      act(() => {
        result.current.socket = mockSocket;
      });

      const message = {
        content: 'Hello',
        chatId: 'chat123',
        sender: 'user123',
      };

      act(() => {
        result.current.sendMessage(message);
      });

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });
}); 