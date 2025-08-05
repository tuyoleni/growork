import React from "react";

export type GlobalSheetProps = {
  snapPoints: string[];
  onDismiss?: () => void;
  children: React.ReactNode;
};

let _openGlobalSheet: (props: GlobalSheetProps) => void = () => {
  console.warn('Global sheet not initialized yet');
};

export function setOpenGlobalSheet(fn: typeof _openGlobalSheet) {
  _openGlobalSheet = fn;
}

export function openGlobalSheet(props: GlobalSheetProps) {
  if (!props.children) {
    console.warn('Cannot open bottom sheet: children is required');
    return;
  }
  if (!props.snapPoints || props.snapPoints.length === 0) {
    props.snapPoints = ['50%'];
  }
  _openGlobalSheet(props);
}
