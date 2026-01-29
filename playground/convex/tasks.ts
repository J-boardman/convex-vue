import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const get = query({
  args: {
    // for testing reactive query args
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query('tasks').collect().then(tasks => tasks.splice(0, args.limit ?? tasks.length))
  },
})

export const listPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query('tasks')
      .order('desc')
      .paginate(args.paginationOpts)
  },
})

export const add = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    return ctx.db.insert('tasks', { text: args.text, isCompleted: false })
  },
})

export const toggle = mutation({
  args: { id: v.id('tasks') },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id)
    if (!task) {
      throw new Error('Task not found')
    }
    await ctx.db.patch(task._id, { isCompleted: !task.isCompleted })
  },
})

export const remove = mutation({
  args: { id: v.id('tasks') },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id)
    if (!task) {
      throw new Error('Task not found')
    }
    await ctx.db.delete(task._id)
  },
})
