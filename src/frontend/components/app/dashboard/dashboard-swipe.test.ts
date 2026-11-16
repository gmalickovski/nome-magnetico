import { it } from 'node:test';
import assert from 'node:assert/strict';
import { createDashboardSwipe } from './dashboard-swipe';

it('move à próxima/anterior, sem confundir toque curto com arrasto', () => {
  const gesture = createDashboardSwipe();
  gesture.start(1, 100, 100); gesture.move(1, 40, 102);
  assert.equal(gesture.end(1, 40, 102), 'next'); assert.equal(gesture.consumeClick(), true); assert.equal(gesture.consumeClick(), false);
  gesture.start(2, 50, 100); gesture.move(2, 110, 105);
  assert.equal(gesture.end(2, 110, 105), 'prev');
  gesture.start(3, 100, 100); gesture.move(3, 104, 101);
  assert.equal(gesture.end(3, 104, 101), null); assert.equal(gesture.consumeClick(), false);
});
it('preserva scroll vertical, controles, zoom com dois dedos e cancelamento', () => {
  const gesture = createDashboardSwipe();
  gesture.start(1, 100, 100); assert.equal(gesture.move(1, 103, 125), false);
  gesture.move(1, 200, 130); assert.equal(gesture.end(1, 200, 130), null);
  gesture.start(2, 100, 100, false); gesture.move(2, 10, 100); assert.equal(gesture.end(2, 10, 100), null);
  gesture.start(3, 100, 100); gesture.start(4, 150, 100); gesture.move(3, 10, 100);
  assert.equal(gesture.end(3, 10, 100), null); assert.equal(gesture.end(4, 200, 100), null);
  gesture.start(5, 100, 100); gesture.move(5, 10, 100); gesture.cancel(5);
  assert.equal(gesture.end(5, 10, 100), null); assert.equal(gesture.consumeClick(), false);
  gesture.start(6, 100, 100); gesture.move(6, 10, 100); assert.equal(gesture.end(6, 10, 100), 'next');
  gesture.start(7, 10, 100); assert.equal(gesture.consumeClick(), false, 'um novo toque não é cancelado pelo swipe anterior');
});
