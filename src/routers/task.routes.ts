import { Router } from "express";
import { inject, injectable } from "inversify";
import { QuizController, TaskController } from "../controllers";
import { ContributionController } from "../controllers/contribution.controller";
import { TwitterController } from "../controllers/twitter.controller";
import { GithubController } from "../controllers/github.controller";

@injectable()
export class TaskRouter {
  private readonly _router: Router;

  constructor(
    @inject(QuizController) private quizController: QuizController,
    @inject(TaskController) private taskVerifierController: TaskController,
    @inject(TwitterController) private twitterController: TwitterController,
    // @inject(GithubController) private githubController: GithubController,
    @inject(ContributionController) private contributionController: ContributionController
  ) {
    this._router = Router({ strict: true });
    this.init();
  }

  private init(): void {

    /**
     * @swagger
     * /api/task/contribution/commit:
     *   post:
     *     summary: Commit a contribution
     *     description: Endpoint to commit a contribution.
     *     tags:
     *       - Contribution
     *     responses:
     *       200:
     *         description: Contribution committed successfully
     *       400:
     *         description: Bad Request
     */
    this._router.post("/contribution/commit", this.contributionController.commitContribution);

    /**
     * @swagger
     * /api/task/contribution/viewByHashes:
     *   post:
     *     summary: View contributions by hashes
     *     description: Endpoint to view contributions by hashes.
     *     tags:
     *       - Contribution
     *     responses:
     *       200:
     *         description: Contributions retrieved successfully
     *       400:
     *         description: Bad Request
     */
    this._router.post("/contribution/viewByHashes", this.contributionController.viewContributionsByHashes);

    /**
     * @swagger
     * /api/task/contribution/viewByCids:
     *   post:
     *     summary: View contributions by cids
     *     description: Endpoint to view contributions by cids.
     *     tags:
     *       - Contribution
     *     responses:
     *       200:
     *         description: Contributions retrieved successfully
     *       400:
     *         description: Bad Request
     */
    this._router.post("/contribution/viewByCids", this.contributionController.viewContributionsByCids);

    /**
     * @swagger
     * /api/task/transaction:
     *   post:
     *     summary: Verify a transaction task
     *     description: Endpoint to verify a transaction task.
     *     tags:
     *       - Task Verifier
     *     responses:
     *       200:
     *         description: Transaction task verified successfully
     *       401:
     *         description: Unauthorized
     */
    this._router.post(
      "/transaction",
      this.taskVerifierController.verifyTransactionTask
    );

    /**
     * @swagger
     * /api/task/quiz/verify:
     *   post:
     *     summary: Verify a quiz task
     *     description: Endpoint to verify a quiz task.
     *     tags:
     *       - Task Verifier
     *     responses:
     *       200:
     *         description: Quiz task verified successfully
     *       401:
     *         description: Unauthorized
     */
    this._router.post(
      "/quiz/verify",
      this.taskVerifierController.verifyQuizTask
    );

    /**
     * @swagger
     * /api/task/discordJoin:
     *   post:
     *     summary: Verify a Discord join task
     *     description: Endpoint to verify a Discord join task.
     *     tags:
     *       - Task Verifier
     *     responses:
     *       200:
     *         description: Discord join task verified successfully
     *       401:
     *         description: Unauthorized
     */
    this._router.post(
      "/discordJoin",
      this.taskVerifierController.verifyDiscordJoinTask
    );

    /**
     * @swagger
     * /api/task/quiz:
     *   post:
     *     summary: Save quiz questions
     *     description: Endpoint to save quiz questions.
     *     tags:
     *       - Quiz
     *     responses:
     *       200:
     *         description: Quiz questions saved successfully
     *       400:
     *         description: Bad Request
     */
    this._router.post("/quiz", this.quizController.saveQestions);

    /**
     * @swagger
     * /api/task/removeQuiz:
     *   post:
     *     summary: Delete quiz questions
     *     description: Endpoint to delete quiz questions.
     *     tags:
     *       - Quiz
     *     responses:
     *       200:
     *         description: Quiz questions deleted successfully
     *       400:
     *         description: Bad Request
     */
    this._router.post("/removeQuiz", this.quizController.deleteQestions);

    /**
     * @swagger
     * /api/task/quizAnswers/{taskAddress}:
     *   get:
     *     summary: Get quiz questions and answers for a specific task
     *     description: Endpoint to retrieve quiz questions and answers for a given task address.
     *     tags:
     *       - Quiz
     *     parameters:
     *       - in: path
     *         name: taskAddress
     *         required: true
     *         schema:
     *           type: string
     *         description: The address of the task.
     *     responses:
     *       200:
     *         description: Questions and answers retrieved successfully
     *       404:
     *         description: Task not found
     */
    this._router.get(
      "/quizAnswers/:taskAddress",
      this.quizController.getQuestionsAndAnswers
    );
    /**
     * @swagger
     * /api/task/quiz/all:
     *   get:
     *     summary: Get all quiz questions and answers
     *     description: Endpoint to retrieve all quiz questions and answers.
     *     tags:
     *       - Quiz
     *     responses:
     *       200:
     *         description: All questions and answers retrieved successfully
     *       500:
     *         description: Internal server error
     */
    this._router.get(
      "/quiz/all",
      this.quizController.getAllQuestionsAndAnswers
    );


    this._router.post(
      "/twitter/follow",
      this.twitterController.verifyTwitterFollow
    );

    this._router.post(
      "/twitter/retweet",
      this.twitterController.verifyTwitterRetweet
    );

    // this._router.post(
    //   "/github/commit",
    //   this.githubController.verifyCommit
    // );

    // this._router.post(
    //   "/github/pr",
    //   this.githubController.verifyPullRequest
    // );
  }

  public get router(): Router {
    return this._router;
  }
}
