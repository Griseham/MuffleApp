// src/components/useEnhancedRoomFeed.test.js
import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor }         from '@testing-library/react';
import { useEnhancedRoomFeed } from '../hooks/useEnhancedRoomFeed';
import axios from 'axios';

jest.mock('axios');                 // uses __mocks__/axios.js

const seeds = [{ name: 'Drake' }, { name: 'SZA' }];

test('rooms stay stable for identical inputs', async () => {
  const { result, rerender } = renderHook(() => useEnhancedRoomFeed(seeds));

  await waitFor(() => result.current.rooms.length > 0, { timeout: 3000 });

  const first = result.current.rooms.map(r => r.id);
  act(() => rerender());
  const second = result.current.rooms.map(r => r.id);

  expect(second).toEqual(first);
});
