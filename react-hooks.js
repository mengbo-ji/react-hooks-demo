/* eslint-disable */
let workInProgressHook = null; // 当前hook 指针
let isMount = true; // 是否是mount

const fiber = {
  memoizedState: null, // 保存 当前App组件的hooks
  next: null,
  stateNode: App,
}

function schedule () {
  workInProgressHook = fiber.memoizedState;
  const app = fiber.stateNode();
  isMount = false;
  return app;
}

function dispatchAction (queue, action) {
  const update = {
    action,
    next: null,
  }
  // 环状链表
  if (queue.pending === null) {
    // u0 -> u0 -> u0
    update.next = update;
  } else {
    // u1 -> u0 -> u1
    // u2 -> u0 -> u1 -> u2
    update.next = queue.pending.next;
    queue.pending.next = update;
  }
  queue.pending = update;
  schedule();
}

function useState (initialState) {
  let hook;
  if (isMount) {
    hook = {
      memoizedState: initialState,
      next: null,
      queue: {
        pending: null,
      }
    }
    // 将组件对应的hook 保存在fiber上的memoizedState 链表中，单向无环
    if (!fiber.memoizedState) {
      fiber.memoizedState = hook
    } else {
      workInProgressHook.next = hook;
    }
    workInProgressHook = hook;
  } else {
    hook = workInProgressHook;
    workInProgressHook = workInProgressHook.next;
  }

  let baseState = hook.memoizedState;
  if (hook.queue.pending !== null) {
    let firstUpdate = hook.queue.pending.next;
    do {
      const action = firstUpdate.action;
      baseState = action(baseState);
      firstUpdate = firstUpdate.next;
    } while (firstUpdate !== hook.queue.pending.next);

    hook.queue.pending = null;
  }

  hook.memoizedState = baseState;
  return [baseState, dispatchAction.bind(null, hook.queue)]
}

function App () {
  const [num, setNum] = useState(0);
  const [num1, setNum1] = useState(10);
  // const ref = useRef('xxx');

  // useEffect(() => {
  //   'xxxx'
  // }, [])

  console.log('isMount:', isMount);
  console.log('num:', num);
  console.log('num1:', num1);

  // const xx = useMemo(() => 'xxx', [])
  // const fn = useCallback(() => console.log('react'), [])


  return {
    onClick () {
      setNum(num => num + 1);
      setNum(num => num + 2);
      setNum(num => num + 3);
    },
    onClick1 () {
      setNum1(num1 => num1 + 10);
    }
  }
}

window.app = schedule();


// 源码是根据不同的时机 来确定是mount 还是 update 我们是靠isMount
// react 有中途跳过更新的
// react hooks 有batchUpdate 的这个手段
// react hooks是有优先级概念的
