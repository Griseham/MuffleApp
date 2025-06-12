import { useState, useCallback, useMemo } from 'react';
import { getBandParams } from './radioUtils';

export default function useTunerCore(initialMode = 'volume', initialVolume = 1325, initialSimilarity = 0) {
  const [mode, setMode] = useState(initialMode);
  const [value, setValue] = useState({ 
    volume: initialVolume, 
    similarity: initialSimilarity 
  });

  // helpers
  const { BAND, MIN } = getBandParams(mode);
  const bandIndex = useMemo(
    () => Math.floor((value[mode] - MIN) / BAND),
    [mode, value, BAND, MIN]
  );

  const onChange = useCallback(
    payload => {
      setValue(v => ({ ...v, ...payload }));
    },
    []
  );

  return { mode, setMode, value, bandIndex, onChange };
}
