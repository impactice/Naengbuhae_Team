import { useEffect, useState } from 'react';
import { fridgeStore, Fridge } from '../store/fridgeStore';

export function useFridges() {
  const [fridges, setFridges] = useState<Fridge[]>(fridgeStore.getFridges());
  const [selected, setSelected] = useState<Fridge | null>(fridgeStore.getSelected());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await fridgeStore.fetch();
      if (mounted) setLoading(false);
    })();

    const unsubscribe = fridgeStore.subscribe(() => {
      setFridges(fridgeStore.getFridges());
      setSelected(fridgeStore.getSelected());
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return {
    fridges,
    selected,
    selectedId: selected?.id ?? null,
    loading,
    select: (id: number) => fridgeStore.select(id),
    refetch: () => fridgeStore.fetch(),
    create: (name: string) => fridgeStore.create(name),
    rename: (id: number, name: string) => fridgeStore.rename(id, name),
    remove: (id: number) => fridgeStore.remove(id),
    createInvite: (id: number) => fridgeStore.createInvite(id),
    join: (code: string) => fridgeStore.join(code),
    removeMember: (fridgeId: number, username: string) => fridgeStore.removeMember(fridgeId, username),
    leave: (fridgeId: number) => fridgeStore.leave(fridgeId),
  };
}
