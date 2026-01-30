<script setup lang="ts">
import type { Doc } from '../../convex/_generated/dataModel'
import { useConvexMutation } from 'convex-vue'
import { api } from '../../convex/_generated/api'

const props = defineProps<{
  task: Doc<'tasks'>
  isPending?: boolean
}>()

const { isPending: isRemoving, mutate: remove } = useConvexMutation(api.tasks.remove)
const { mutate: toggle } = useConvexMutation(api.tasks.toggle)

function handleRemove() {
  remove({ id: props.task._id })
}
</script>

<template>
  <li>
    <input
      :id="task._id"
      type="checkbox"
      :checked="task.isCompleted"
      @change="toggle({ id: task._id })"
    >
    <label :for="task._id">{{ task.text }}</label>
    <button
      type="button"
      @click="handleRemove"
    >
      <span v-if="isPending || isRemoving">...</span>
      <span v-else>X</span>
    </button>
  </li>
</template>

<style scoped>
li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e5e5;
  transition: background-color 0.15s;
}

li:last-child {
  border-bottom: none;
}

li:hover {
  background-color: #f9f9f9;
}

input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #4a90e2;
}

input[type='checkbox']:disabled {
  cursor: not-allowed;
}

label {
  flex: 1;
  cursor: pointer;
  color: #333;
  font-size: 0.95rem;
}

button {
  margin-left: auto;
  padding: 0.4rem 0.75rem;
  background-color: transparent;
  color: #999;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

button:hover {
  background-color: #fee;
  color: #c33;
  border-color: #fcc;
}
</style>
