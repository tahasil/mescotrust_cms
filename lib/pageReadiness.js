"use client";

import { useEffect, useRef } from "react";

let taskSequence = 0;

function getPendingTasks() {
  if (typeof window === "undefined") return null;
  if (!(window.__mescoPendingReadyTasks instanceof Set)) {
    window.__mescoPendingReadyTasks = new Set();
  }
  return window.__mescoPendingReadyTasks;
}

export function registerPageReadyTask(taskId) {
  if (!taskId || typeof window === "undefined") return;
  const pending = getPendingTasks();
  if (pending?.has(taskId)) return;
  pending?.add(taskId);
  window.__mescoPageReady?.register?.(taskId);
}

export function resolvePageReadyTask(taskId) {
  if (!taskId || typeof window === "undefined") return;
  const pending = getPendingTasks();
  if (!pending?.has(taskId)) return;
  pending.delete(taskId);
  window.__mescoPageReady?.resolve?.(taskId);
}

/**
 * Keeps the public page loader active while a client-rendered module is
 * resolving data needed for its first complete render.
 */
export function usePageReadyTask(active, label = "module") {
  const taskIdRef = useRef("");
  if (!taskIdRef.current) {
    taskSequence += 1;
    taskIdRef.current = `${label}-${taskSequence}`;
  }

  const taskId = taskIdRef.current;
  if (active) registerPageReadyTask(taskId);

  useEffect(() => {
    if (active) registerPageReadyTask(taskId);
    else resolvePageReadyTask(taskId);

    return () => resolvePageReadyTask(taskId);
  }, [active, taskId]);
}
