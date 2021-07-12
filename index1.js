
var workInProgressHook; // 指的是当前正在工作的hook
var fiber = {
  memoizedState: null,
  stateNode: App,
}
let isMount = true; // 首次还是更新

function schedule () {
  // 创建update
  // 更新前将workInProgressHook重置为fiber保存的第一个Hook
  workInProgressHook = fiber.memoizedState;
  // 触发组件渲染
  const app = fiber.stateNode();
  isMount = false;
  return app;
}

function dispatchAction (queue, action) {
  // 创建update
  const update = {
    action,
    next: null,
  }
  // 环状链表处理逻辑 eg: a->a、a->b->a
  if (queue.pending == null) {
    update.next = update;
  } else {
    update.next = queue.pending.next;
    queue.pending.next = update;
  }
  queue.pending = update;
  // 模拟react调度
  schedule();
}

function useState(initialState) {
  let hook
  if (isMount) {
    hook = {
      // 保存更新的数据 也就是上面的环状链表
      queue: {
        pending: null,
      },
      // 保存useState的状态
      memoizedState: initialState,
      // 与下一个hook行程单向无环链表
      next: null
    }

    // 将hook插入 fiber.memoziedState 链表结尾
    if (!fiber.memoizedState) {
      fiber.memoizedState = hook;
    } else {
      workInProgressHook.next = hook;
    }

    // 移动指针
    workInProgressHook = hook;
  } else {
    // 找到对应hook
    hook = workInProgressHook;
    workInProgressHook = workInProgressHook.next;
  }

  // 从hook中获取之前的状态
  let baseState = hook.memoizedState;
  if (hook.queue.pending) {
    // 获取update环状单向链表中第一个update
    let firstUpdate = hook.queue.pending.next;
    do {
      // 执行action
      const action = firstUpdate.action;
      baseState = action(baseState);
      firstUpdate = firstUpdate.next;
      // 最后一个update执行完后跳出循环
    } while (firstUpdate !== hook.queue.pending.next);

    // 清空queue.pending
    hook.queue.pending = null;
  }

  // 将update action执行完后的state作为memoizedState
  hook.memoizedState = baseState;
  return [ baseState, dispatchAction.bind(null, hook.queue) ]
}


function App () {
  const [num, setNum] = useState(0);
  const [num1, setNum1] = useState(10);

  console.log(`${isMount ? 'mount' : 'update'} num: `, num);
  console.log(`${isMount ? 'mount' : 'update'} num1: `, num1);

  // 抽象react
  return {
    click () {
      setNum(num => num + 1)
    },
    click1 () {
      setNum1(num1 => num1 + 1)
    },
  };
}

window.app = schedule();