type SheetProps = {
    header?: React.ReactNode;
    body: React.ReactNode;
    footer?: React.ReactNode;
    snapPoints: string[];
  };
  
  let _openGlobalSheet: (props: SheetProps) => void = () => {};
  
  export function setOpenGlobalSheet(fn: typeof _openGlobalSheet) {
    _openGlobalSheet = fn;
  }
  
  export function openGlobalSheet(props: SheetProps) {
    _openGlobalSheet(props);
  }
  