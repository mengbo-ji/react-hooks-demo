
let workInProgressHook = null; // 当前hook

// 极简fiber
const fiber = {
  memoizedState: null, // 无环单向链表，保存的是每个组件对应的hook
  stateNode: App,
}

// 组件是第一次加载还是update
let isMount = true;

// 模拟react的调度器
function schedule () {
  // 每次调度之前都需要将 workInProgressHook 赋值为 fiber.memoizedState
  workInProgressHook = fiber.memoizedState;
  const app = fiber.stateNode();
  // 调用之后就不是 mount
  isMount = false;
  return app;
}

// useState返回的函数
function dispatchAction (queue, action) {
  const update = {
    action, // 当前要执行的函数
    next: null, // 与同一个Hook的其他更新形成链表
  }

  // 环状链表的操作
  if (!queue.pending) {
    update.next = update;
  } else {
    update.next = queue.pending.next;
    queue.pending.next = update;
  }
  queue.pending = update;

  // 模拟调度
  schedule();
}

// useState
function useState (initialState) {
  let hook;
  if (isMount) {
    hook = {
      queue: {
        pending: null, // 存放同一个hook 多个update的一条环状链表
      },
      memoizedState: initialState, // hook的初始状态
      next: null, // 指向下一个hook
    }
    // 将对应 hook 追加到fiber.memoziedState 的链表结尾
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
    // 移动指针
    workInProgressHook = workInProgressHook.next;
  }

  // 取到对应的上次的数据
  let baseState = hook.memoizedState;
  // 有更新
  if (hook.queue.pending !== null) {
    let firstUpdate = hook.queue.pending.next; //拿到第一个更新
    do {
      const action = firstUpdate.action; // 拿到action
      baseState = action(baseState); // 调用函数
      firstUpdate = firstUpdate.next; // 移动指针
      // 最后一个update 执行完毕跳出循环
    } while (firstUpdate !== hook.queue.pending.next);
    
    // 更新完清空 hook update的队列
    hook.queue.pending = null;
  }

  // 将 update action执行之后的数据保存在hook上
  
  hook.memoizedState = baseState;
  return [baseState, dispatchAction.bind(null, hook.queue)]
}

// app组件
function App () {
  const [num, setNum] = useState(1); // useState
  const [num1, setNum1] = useState(2); // useState

  console.log(isMount ? 'Mount' : 'Update', `num: ${num}`)
  console.log(isMount ? 'Mount' : 'Update', `num1: ${num1}`)

  return {
    click () {
      setNum(num => num + 1)
    },
    click1 () {
      setNum1(num1 => num1 + 1)
    }
  }
}

window.app = schedule();
