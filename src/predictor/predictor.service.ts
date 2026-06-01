import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { spawn } from 'child_process';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PredictorService {

  constructor(
    private prisma: PrismaService,
  ) {}

  async analyzePrediction(payload: any): Promise<any> {

    try {

      // =========================
      // FETCH FROM DATABASE
      // =========================

      const rows =
        await this.prisma.cutoffPrediction.findMany();

      // =========================
      // FORMAT FOR PYTHON
      // =========================

      const dataset = rows.map((row) => ({

        Institute: row.institute,

        college_state: row.collegeState,

        branch_shortcut: row.branchShortcut,

        degree_type: row.degreeType,

        Quota: row.quota,

        Category: row.seatType,

        Gender: row.gender,

        predicted_closing_rank_2026:
          row.predictedClosingRank2026,

        institute_type: row.instituteType,

        Global_Prestige_Index:
          row.globalPrestigeIndex,

        Global_Branch_Popularity:
          row.globalBranchPopularity,
      }));

      // =========================
      // PYTHON PAYLOAD
      // =========================

      const pythonPayload = {

        dataset,

        user: {

          user_rank: Number(payload.rank),

          category: payload.category,

          gender: payload.gender,

          home_state: payload.homeState,

          exam_type: payload.examType,

          target_branch: payload.branch,

          target_college: payload.college,
        },
      };

      // =========================
      // PYTHON EXECUTION
      // =========================

      const pythonPath = process.env.PYTHON_CMD || 'python3';

      const scriptPath = path.join(
        process.cwd(),
        'python',
        'josaa_predictor.py',
      );

      return await new Promise((resolve, reject) => {
        const py = spawn(pythonPath, [scriptPath]);
        
        let result = '';
        let errorOutput = '';

        py.on('error', (err) => {
          console.error('Failed to spawn python:', err);
          reject({
            status: 'error',
            message: `Python process error: ${err.message}`,
          });
        });

        py.stdout.on('data', (data) => {
          result += data.toString();
        });

        py.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        py.on('close', (code) => {

          if (code !== 0) {

            console.error(errorOutput);

            reject({
              status: 'error',
              message: errorOutput,
            });

            return;
          }

          try {

            const parsed =
              JSON.parse(result);

            resolve(parsed);

          } catch (err) {

            reject({
              status: 'error',
              message:
                'Invalid Python JSON response',
              raw: result,
            });
          }
        });

        py.stdin.write(
          JSON.stringify(pythonPayload),
        );

        py.stdin.end();
      });

    } catch (error: any) {

      console.error(error);

      throw error;
    }
  }
}