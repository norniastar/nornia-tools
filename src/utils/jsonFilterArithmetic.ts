import { parse as parseScript } from '@babel/parser';
import generate from '@babel/generator';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { isLosslessNumber } from 'lossless-json';

const arithmeticBinaryOperators = new Set<t.BinaryExpression['operator']>(['+', '-', '*', '/', '%', '**']);
const arithmeticAssignmentOperators = new Set<t.AssignmentExpression['operator']>(['+=', '-=', '*=', '/=', '%=', '**=']);

const normalizeArithmeticOperand = (operator: t.BinaryExpression['operator'], value: unknown) => {
  const normalized = isLosslessNumber(value) ? value.valueOf() : value;

  if (normalized === null) {
    return 0;
  }

  if (typeof normalized === 'boolean') {
    return Number(normalized);
  }

  if (typeof normalized === 'string') {
    if (operator === '+') {
      return normalized;
    }

    return Number(normalized);
  }

  return normalized;
};

const toCompatibleBigInt = (value: unknown) => {
  if (typeof value === 'bigint') {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      throw new TypeError('Cannot mix BigInt with non-integer numbers in JSON filter arithmetic');
    }

    return BigInt(value);
  }

  if (typeof value === 'string' && /^-?(0|[1-9]\d*)$/.test(value)) {
    return BigInt(value);
  }

  throw new TypeError('Cannot mix BigInt with non-integer values in JSON filter arithmetic');
};

const applyRegularBinaryOperator = (operator: t.BinaryExpression['operator'], left: unknown, right: unknown) => {
  switch (operator) {
    case '+':
      return (left as any) + (right as any);
    case '-':
      return (left as any) - (right as any);
    case '*':
      return (left as any) * (right as any);
    case '/':
      return (left as any) / (right as any);
    case '%':
      return (left as any) % (right as any);
    case '**':
      return (left as any) ** (right as any);
    default:
      throw new TypeError(`Unsupported JSON filter operator: ${operator}`);
  }
};

const applyBigIntBinaryOperator = (operator: t.BinaryExpression['operator'], left: bigint, right: bigint) => {
  switch (operator) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      return left / right;
    case '%':
      return left % right;
    case '**':
      return left ** right;
    default:
      throw new TypeError(`Unsupported JSON filter operator: ${operator}`);
  }
};

export const jsonBinaryOp = (operator: t.BinaryExpression['operator'], left: unknown, right: unknown) => {
  const normalizedLeft = normalizeArithmeticOperand(operator, left);
  const normalizedRight = normalizeArithmeticOperand(operator, right);

  if (operator === '+' && (typeof normalizedLeft === 'string' || typeof normalizedRight === 'string')) {
    return String(normalizedLeft) + String(normalizedRight);
  }

  const usesBigInt = typeof normalizedLeft === 'bigint' || typeof normalizedRight === 'bigint';
  if (!usesBigInt) {
    return applyRegularBinaryOperator(operator, normalizedLeft, normalizedRight);
  }

  return applyBigIntBinaryOperator(
    operator,
    toCompatibleBigInt(normalizedLeft),
    toCompatibleBigInt(normalizedRight)
  );
};

export const rewriteJsonFilterArithmetic = (source: string) => {
  const ast = parseScript(source, {
    sourceType: 'script',
    allowReturnOutsideFunction: true,
  });

  traverse(ast, {
    BinaryExpression(path) {
      if (!arithmeticBinaryOperators.has(path.node.operator)) {
        return;
      }

      if (t.isPrivateName(path.node.left) || t.isPrivateName(path.node.right)) {
        return;
      }

      path.replaceWith(
        t.callExpression(t.identifier('__jsonBinaryOp'), [
          t.stringLiteral(path.node.operator),
          path.node.left,
          path.node.right,
        ])
      );
      path.skip();
    },
    AssignmentExpression(path) {
      if (!arithmeticAssignmentOperators.has(path.node.operator)) {
        return;
      }

      if (!t.isIdentifier(path.node.left) && !t.isMemberExpression(path.node.left)) {
        return;
      }

      const operator = path.node.operator.slice(0, -1) as t.BinaryExpression['operator'];
      path.replaceWith(
        t.assignmentExpression(
          '=',
          path.node.left,
          t.callExpression(t.identifier('__jsonBinaryOp'), [
            t.stringLiteral(operator),
            t.cloneNode(path.node.left),
            path.node.right,
          ])
        )
      );
      path.skip();
    },
  });

  return generate(ast, { comments: true }).code;
};
