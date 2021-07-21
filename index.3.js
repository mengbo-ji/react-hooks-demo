let isMount = true; // 区分mount update
let workInProgressHook = null; // 操作hook 链表

const fiber = {
  memoizedState: null, // 保存对应组件的hook, 单向链表
  stateNode: App, // 对应组件本身
}

// 调度器 触发更新
function schedule() {
  workInProgressHook = fiber.memoizedState;
  const app = fiber.stateNode();
  isMount = false;
  return app;
}

function dispatchAction(queue, action) {
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
    update.next = queue.pending.next;
    queue.pending.next = update;
  }

  queue.pending = update;
  schedule();
}

function useState(initialState) {
  let hook;
  if (isMount) {
    hook = {
      memoizedState: initialState,
      next: null,
      queue: {
        pending: null,
      }
    }
    if (fiber.memoizedState === null) {
      fiber.memoizedState = hook;
    } else {
      workInProgressHook.next = hook;
    }
    workInProgressHook = hook;
  } else {
    hook = workInProgressHook;
    workInProgressHook = workInProgressHook.next;
  }

  // 更新基于的上次数据
  let baseState = hook.memoizedState;
  // 判断需不需要更新
  if (hook.queue.pending !== null) {
    let firstUpdate = hook.queue.pending.next;
    do {
      const action = firstUpdate.action;
      baseState = action(baseState);
      firstUpdate = firstUpdate.next;
    } while(firstUpdate !== hook.queue.pending.next)

    hook.queue.pending = null;
  }

  hook.memoizedState = baseState;

  return [ baseState, dispatchAction.bind(null, hook.queue) ]
}

function App() {
  const [ num, setNum ] = useState(0);
  const [ num1, setNum1 ] = useState(10);

  console.log('isMount:', isMount);
  console.log('num:', num);
  console.log('num1:', num1);

  return {
    onClick() {
      setNum(num => num + 1)
    },
    onClick1() {
      setNum1(num => num + 10)
    }
  }
}

window.app = schedule();

