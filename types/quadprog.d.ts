declare module 'quadprog' {
  interface SolveQPResult {
    solution: number[];
    value: number;
    unconstrained_solution: number[];
    iterations: number[];
    Lagrangian: number[];
    iact: number[];
    message: string;
  }

  export function solveQP(
    Dmat: number[][],
    dvec: number[],
    Amat: number[][],
    bvec: number[],
    meq?: number,
    factorized?: boolean
  ): SolveQPResult;
}
