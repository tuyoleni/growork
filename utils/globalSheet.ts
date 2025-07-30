import { GlobalBottomSheetProps } from "@/components/GlobalBottomSheet";
import React from "react";

export type SheetProps = {
  header?: React.ReactNode;
  body: React.ReactNode;
  footer?: React.ReactNode;
  snapPoints: string[];
};

let _openGlobalSheet: (props: Partial<GlobalBottomSheetProps>) => void = () => {
  console.warn('Global sheet not initialized yet');
};

export function setOpenGlobalSheet(fn: typeof _openGlobalSheet) {
  _openGlobalSheet = fn;
}

export function openGlobalSheet(props: SheetProps) {
  if (!props.body) {
    console.warn('Cannot open bottom sheet: body is required');
    return;
  }
  
  if (!props.snapPoints || props.snapPoints.length === 0) {
    props.snapPoints = ['50%'];
  }
  
  _openGlobalSheet(props);
}
