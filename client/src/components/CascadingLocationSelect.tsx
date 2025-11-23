// file: client/src/components/CascadingLocationSelect.tsx
import { useState, useEffect, useMemo } from 'react';
import { Location } from '../types';
import CustomSelect from './CustomSelect';

interface Props {
  locations: Location[];
  value: string | null;
  onChange: (locId: string | null) => void;
  highlightLevel?: number | null; 
}

export default function CascadingLocationSelect({ locations, value, onChange, highlightLevel }: Props) {
  const locMap = useMemo(() => new Map(locations.map(l => [l.id, l])), [locations]);

  const getAncestors = (targetId: string | null): string[] => {
    if (!targetId) return [];
    const loc = locMap.get(targetId);
    if (!loc) return [];
    return [...getAncestors(loc.parentId), loc.id];
  };

  const [selectedIds, setSelectedIds] = useState<string[]>(['', '', '', '']);

  useEffect(() => {
    if (value) {
      const ancestors = getAncestors(value);
      const padded = [...ancestors];
      while(padded.length < 4) padded.push('');
      if (JSON.stringify(padded) !== JSON.stringify(selectedIds)) {
        setSelectedIds(padded);
      }
    } else if (!value && selectedIds.some(id => id !== '')) {
       setSelectedIds(['','','','']);
    }
  }, [value, locMap]); 

  const getOptions = (levelIndex: number) => {
    let availableLocs: Location[] = [];

    if (levelIndex === 0) {
        availableLocs = locations.filter(l => !l.parentId);
    } else {
        const parentId = selectedIds[levelIndex - 1];
        if (!parentId) {
            // No parent selected, show all potential locations at this depth
            availableLocs = locations.filter(l => {
                let depth = 0;
                let curr = l;
                while(curr.parentId) {
                    depth++;
                    const p = locMap.get(curr.parentId);
                    if(!p) break; 
                    curr = p;
                }
                return depth === levelIndex;
            });
        } else {
            availableLocs = locations.filter(l => l.parentId === parentId);
        }
    }

    // 核心修复：手动添加 "空" 选项
    // 只有当有选项或者为了允许清空时才显示（这里总是显示以便清空）
    const options = availableLocs.map(l => ({ label: l.name, value: l.id }));
    return [{ label: '(None)', value: '' }, ...options];
  };

  const handleSelect = (levelIndex: number, id: string) => {
    let newIds = [...selectedIds];
    newIds[levelIndex] = id;

    if (id) {
        // Back-fill parents
        const ancestors = getAncestors(id); 
        for(let i=0; i<levelIndex; i++) {
            if(ancestors[i]) newIds[i] = ancestors[i];
        }
        // Clear conflicting children
        for(let i = levelIndex + 1; i < 4; i++) {
            newIds[i] = '';
        }
    } else {
        // Selected "Empty" -> Clear all children down the chain
        for(let i = levelIndex + 1; i < 4; i++) newIds[i] = '';
    }

    setSelectedIds(newIds);
    
    let finalId = null;
    for(let i=3; i>=0; i--) { if(newIds[i]) { finalId = newIds[i]; break; } }
    onChange(finalId);
  };

  const levels = ['Warehouse', 'Aisle', 'Shelf', 'Bin'];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {[0, 1, 2, 3].map(level => {
        // getOptions now returns the object format expected by CustomSelect directly
        const options = getOptions(level); 
        const isHighlighted = highlightLevel === level;
        
        return (
          <div key={level} className={`transition-all duration-300 ${isHighlighted ? 'transform -translate-y-1' : ''}`}>
             <CustomSelect 
                value={selectedIds[level]}
                onChange={(val) => handleSelect(level, val)}
                options={options}
                placeholder={levels[level]}
                className={isHighlighted ? "ring-2 ring-warning ring-offset-1 rounded-lg shadow-lg" : ""}
             />
          </div>
        );
      })}
    </div>
  );
}