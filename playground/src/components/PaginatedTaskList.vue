<script setup lang="ts">
import { useConvexMutation, useConvexPaginatedQuery } from 'convex-vue'
import { computed, ref } from 'vue'
import { api } from '../../convex/_generated/api'
import TaskListItem from './TaskListItem.vue'

const { results, status, isPending, loadMore, error } = useConvexPaginatedQuery(
  api.tasks.listPaginated,
  {},
  { initialNumItems: 5 },
)
const newTask = ref('')
const { isPending: isNewTaskLoading, mutate: addTask } = useConvexMutation(api.tasks.add)

function handleNewTask() {
  if (newTask.value.trim() === '') {
    return
  }
  addTask({ text: newTask.value })
  newTask.value = ''
}

function handleLoadMore() {
  loadMore(5)
}

const canLoadMore = computed(() => status.value === 'CanLoadMore')
const isLoadingMore = computed(() => status.value === 'LoadingMore')
</script>

<template>
  <div class="task-list-container">
    <div class="header-section">
      <h1>Paginated Tasks</h1>
      <form @submit.prevent="handleNewTask">
        <input
          v-model="newTask"
          name="task"
          type="text"
          placeholder="Add a task"
        >
        <button
          type="submit"
          :disabled="isNewTaskLoading"
        >
          <span v-if="isNewTaskLoading">Saving..</span>
          <span v-else>Save</span>
        </button>
      </form>
      <p
        v-if="error"
        class="error"
      >
        Error: {{ error?.message }}
      </p>
    </div>
    <div class="list-section">
      <ul v-if="results">
        <li v-if="results.length === 0 && !isPending">
          No tasks found.
        </li>
        <TaskListItem
          v-for="task in results"
          :key="task._id"
          :task="task"
        />
      </ul>
      <div class="load-more">
        <button
          v-if="canLoadMore"
          type="button"
          :disabled="isLoadingMore"
          @click="handleLoadMore"
        >
          <span v-if="isLoadingMore">Loading more...</span>
          <span v-else>Load More</span>
        </button>
        <p v-else-if="status === 'Exhausted'">
          All tasks loaded.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-list-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.header-section {
  flex-shrink: 0;
}

h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: #1a1a1a;
}

.status {
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background-color: #f5f5f5;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #666;
}

.status strong {
  color: #333;
  font-weight: 600;
}

form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

form input[type='text'] {
  flex: 1;
  padding: 0.6rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: border-color 0.2s;
}

form input[type='text']:focus {
  outline: none;
  border-color: #4a90e2;
}

form button {
  padding: 0.6rem 1.25rem;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

form button:hover:not(:disabled) {
  background-color: #357abd;
}

form button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error {
  color: #d32f2f;
  background-color: #ffebee;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.list-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  margin-top: 1rem;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  overflow: hidden;
}

.load-more {
  flex-shrink: 0;
  text-align: center;
  padding: 1rem 0 0.5rem 0;
}

.load-more button {
  padding: 0.6rem 1.5rem;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.load-more button:hover:not(:disabled) {
  background-color: #357abd;
}

.load-more button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.load-more p {
  color: #999;
  font-size: 0.9rem;
  margin: 0;
}
</style>
