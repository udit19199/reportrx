"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

type DrawerControls = {
  open: () => void;
  close: () => void;
  toggle: () => void;
};

type WorkspaceDrawerContextValue = {
  register: (controls: DrawerControls) => () => void;
  openReports: () => void;
  toggleReports: () => void;
};

const WorkspaceDrawerContext =
  createContext<WorkspaceDrawerContextValue | null>(null);

export function WorkspaceDrawerProvider({ children }: { children: ReactNode }) {
  const controlsRef = useRef<DrawerControls | null>(null);

  const register = useCallback((controls: DrawerControls) => {
    controlsRef.current = controls;
    return () => {
      if (controlsRef.current === controls) {
        controlsRef.current = null;
      }
    };
  }, []);

  const openReports = useCallback(() => {
    controlsRef.current?.open();
  }, []);

  const toggleReports = useCallback(() => {
    controlsRef.current?.toggle();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        controlsRef.current?.toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <WorkspaceDrawerContext.Provider
      value={{ register, openReports, toggleReports }}
    >
      {children}
    </WorkspaceDrawerContext.Provider>
  );
}

export function useWorkspaceDrawer() {
  return useContext(WorkspaceDrawerContext);
}

/** Register drawer controls from the workspace page. */
export function useRegisterReportsDrawer(controls: DrawerControls) {
  const ctx = useWorkspaceDrawer();

  useEffect(() => {
    if (!ctx) return;
    return ctx.register(controls);
  }, [ctx, controls.open, controls.close, controls.toggle]);
}
