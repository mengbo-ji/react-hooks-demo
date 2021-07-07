let workInProgressHook = null; // 保存hooks的无环单链表
let isMount = true; // // 首次render时是mount

const fiber = {
  memoizedState: null, // 保存该FunctionComponent对应的Hooks链表
  stateNode: App, // 指向App函数
}

// 调度器
function schedule () {
  // 更新前将workInProgressHook重置为fiber保存的第一个Hook
  workInProgressHook = fiber.memoizedState;
  // 触发组件render
  const app = fiber.stateNode();
  // 组件首次render为mount，以后再触发的更新为update
  isMount = false;
  return app;
}

// useState 调用的函数
function dispatchAction (queue, action) {
  const update = {
    action, // 回调
    next: null, // 下一个update
  }

  // 生成一条环状单向链表
  if (queue.pending === null) {
    update.next = update;
  } else {
    update.next = queue.pending.next;
    queue.pending.next = update;
  }
  queue.pending = update;
  schedule();
}

/**
 * @param initialState mount的时候useState 的初始值
*/

function useState (initialState) {
  let hook = null;
  if (isMount) {
    hook = {
      // 保存update的queue，即上文介绍的queue
      queue: {
        pending: null,
      },
      // 保存hook对应的state
      memoizedState: initialState,
      // 与下一个Hook连接形成单向无环链表
      next: null,
    }

    // 将hook插入fiber.memoizedState链表末尾
    if (!fiber.memoizedState) {
      fiber.memoizedState = hook;
    } else {
      workInProgressHook.next = hook;
    }
    // 移动workInProgressHook指针
    workInProgressHook = hook;
  } else {
    alert('1')
    hook = workInProgressHook;
    // 移动workInProgressHook指针
    workInProgressHook = workInProgressHook.next;
  }

  // update执行前的初始state
  let baseState = hook.memoizedState;
  if (hook.queue.pending) {
    // ...根据queue.pending中保存的update更新state
    // 获取update环状单向链表中第一个update
    let firstUpdate = hook.queue.pending.next;

    do {
      // 执行update 的action
      const action = firstUpdate.action;
      baseState = action(baseState);
      firstUpdate = firstUpdate.next;
      // 最后一个update执行完后跳出循环
    } while (firstUpdate !== hook.queue.pending.next)

    // 清空 queue.pedning
    hook.queue.pending = null;
  }

  // 将update action执行完后的state作为memoizedState
  hook.memoizedState = baseState;

  return [baseState, dispatchAction.bind(null, hook.queue)];
}


function App () {
  const [num, updateNum] = useState(0);
  const [num1, updateNum1] = useState(100);
  console.log(`${isMount ? 'mount' : 'update'} num: `, num);
  console.log(`${isMount ? 'mount' : 'update'} num1: `, num1);
  return {
    click () {
      updateNum(num => num + 1);
    },
    click1 () {
      updateNum1(num1 => num1 + 10);
    }
  }
}

window.app = schedule();

console.log('fiber', fiber)
console.log('hook', workInProgressHook)
