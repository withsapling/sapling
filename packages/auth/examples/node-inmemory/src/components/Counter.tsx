export function Counter() {
  return (
    <sapling-island loading="visible">
      <template>
        <script type="module" src="/components/Counter.js"></script>
      </template>
      <div class="w-full h-full flex items-center justify-center">
        <button
          id="counter-button"
          onclick="window.increment?.()" 
          class="px-6 py-3 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition duration-150 flex items-center gap-2 shadow-lg">
          Click Count: <span id="counter-count">0</span>
        </button>
      </div>
    </sapling-island>
  );
}