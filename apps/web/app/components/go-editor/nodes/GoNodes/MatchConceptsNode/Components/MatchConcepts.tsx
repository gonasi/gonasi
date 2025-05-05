import { useEffect, useState } from 'react';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { Check, RefreshCw } from 'lucide-react';

import { DraggableRight } from './DraggableRight';
import { DroppableArea } from './DroppableArea';
import { RightOverlay } from './RightOverlay';
import type { LeftItem, RightItem } from './types';

import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';

const items = [
  { item: 'Ambulance', value: 'Emergency response' },
  { item: 'Matatu', value: 'Public transport' },
  { item: 'Pickup truck', value: 'Goods delivery' },
  { item: 'Police van', value: 'Law enforcement' },
];

export function MatchConcepts() {
  // Create a mapping of correct matches based on the example data
  const correctMatchesMap: Record<string, string> = {};

  const initialLeftItems: LeftItem[] = items.map((item, index) => {
    const leftId = `left-${index}`;
    const rightId = `right-${index}`;

    // Store the correct match
    correctMatchesMap[leftId] = rightId;

    return {
      id: leftId,
      content: item.item,
      matchedWith: null,
    };
  });

  const initialRightItems: RightItem[] = items.map((item, index) => ({
    id: `right-${index}`,
    content: item.value,
    isPlaced: false,
  }));

  // State for leftItems and rightItems
  const [leftItems, setLeftItems] = useState<LeftItem[]>(initialLeftItems);
  const [rightItems, setRightItems] = useState<RightItem[]>(initialRightItems);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [activeRightItem, setActiveRightItem] = useState<RightItem | null>(null);

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px of movement required before activation
      },
    }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    // Check if all leftItems have matched rightItems
    const allMatched = leftItems.every((left) => left.matchedWith !== null);
    setIsComplete(allMatched);
  }, [leftItems]);

  // Get available rightItems (not yet placed)
  const availablePurposes = rightItems.filter((right) => !right.isPlaced);

  // Handle drag start
  function handleDragStart(event: any) {
    const { active } = event;
    const rightId = active.id as string;
    const right = rightItems.find((p) => p.id === rightId);

    if (right) {
      setActiveRightItem(right);
    }
  }

  // Handle drag end
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveRightItem(null);

    // If not dropped over a droppable or no active item, do nothing
    if (!over || !active) return;

    const rightId = active.id as string;
    const dropzoneId = over.id as string;

    // Extract left ID from dropzone ID (format: "dropzone-left-X")
    const leftId = dropzoneId.replace('dropzone-', '');

    // Find the left and right
    const left = leftItems.find((v) => v.id === leftId);
    const right = rightItems.find((p) => p.id === rightId);

    // If left already has a match or items not found, do nothing
    if (!left || !right || left.matchedWith !== null) return;

    // Check if it's a correct match
    const isCorrectMatch = correctMatchesMap[leftId] === rightId;

    if (isCorrectMatch) {
      // Update the left with the matched right
      setLeftItems(leftItems.map((v) => (v.id === leftId ? { ...v, matchedWith: rightId } : v)));

      // Update the right as placed
      setRightItems(rightItems.map((p) => (p.id === rightId ? { ...p, isPlaced: true } : p)));

      setScore(score + 1);
    }
  }

  const resetGame = () => {
    setLeftItems(leftItems.map((left) => ({ ...left, matchedWith: null })));
    setRightItems(rightItems.map((right) => ({ ...right, isPlaced: false })));
    setIsComplete(false);
    setScore(0);
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mx-auto max-w-4xl'>
        <div className='mb-6 flex items-center justify-between'>
          <div className='text-lg font-medium'>
            Score: {score}/{leftItems.length}
          </div>
          <Button onClick={resetGame} size='sm' className='flex items-center gap-2'>
            <RefreshCw className='h-4 w-4' />
            Reset
          </Button>
        </div>

        {isComplete && (
          <Card className='mb-6 border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20'>
            <div className='flex items-center gap-2 text-green-700 dark:text-green-400'>
              <Check className='h-5 w-5' />
              <span className='font-medium'>
                Congratulations! You've matched all leftItems to their rightItems correctly.
              </span>
            </div>
          </Card>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToWindowEdges]}
        >
          {/* Vehicles with drop zones */}
          <div className='mb-12 grid gap-4'>
            {leftItems.map((left) => {
              const matchedPurpose = rightItems.find((right) => right.id === left.matchedWith);

              return (
                <div key={left.id} className='flex items-center gap-4'>
                  <div className='w-1/2 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
                    <span className='font-medium'>{left.content}</span>
                  </div>

                  <div className='w-1/2'>
                    <DroppableArea
                      id={`dropzone-${left.id}`}
                      leftItem={left}
                      matchedRightItem={matchedPurpose}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Draggable rightItems */}
          <div className='mt-8'>
            <h2 className='mb-4 text-center text-xl font-semibold'>Vehicle Purposes</h2>
            <div className='flex min-h-[100px] flex-wrap justify-center gap-3 rounded-lg bg-gray-100 p-4 dark:bg-gray-800/50'>
              {availablePurposes.map((right) => (
                <DraggableRight key={right.id} right={right} />
              ))}
            </div>
          </div>

          {/* Drag overlay for visual feedback */}
          <DragOverlay>
            {activeRightItem ? <RightOverlay right={activeRightItem} /> : null}
          </DragOverlay>
        </DndContext>

        <div className='mt-8 text-center text-sm text-gray-500 dark:text-gray-400'>
          Drag the rightItems from the bottom and drop them next to their matching leftItems.
        </div>
      </div>
    </div>
  );
}
