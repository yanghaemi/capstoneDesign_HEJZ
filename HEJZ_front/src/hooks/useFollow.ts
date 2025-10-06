import { useEffect, useState, useCallback } from 'react';
import { amIFollowing, follow, unfollow } from '../api/follow';

export function useFollow(targetUsername: string, initial?: boolean) {
  const [following, setFollowing] = useState(!!initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    if (initial === undefined) {
      amIFollowing(targetUsername).then(v => { if (alive) setFollowing(v); });
    }
    return () => { alive = false; };
  }, [targetUsername, initial]);

  const toggle = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (following) {
        await unfollow(targetUsername);
        setFollowing(false);
      } else {
        await follow(targetUsername);
        setFollowing(true);
      }
    } finally {
      setLoading(false);
    }
  }, [following, targetUsername, loading]);

  return { following, loading, toggle, setFollowing };
}
