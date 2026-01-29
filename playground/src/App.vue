<script setup lang="ts">
import PaginatedTaskList from './components/PaginatedTaskList.vue'
import TaskList from './components/TaskList.vue'
</script>

<template>
  <div class="app">
    <div class="examples">
      <div class="example">
        <Suspense>
          <TaskList is-sync />
          <template #fallback>
            Loading via suspense...
          </template>
        </Suspense>
      </div>
      <div class="example">
        <PaginatedTaskList />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  height: 100dvh;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.examples {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  flex: 1;
  min-height: 0;
}

.example {
  background-color: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 1024px) {
  .app {
    padding: 0.75rem;
  }

  .examples {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .example {
    padding: 1.25rem;
  }
}
</style>
