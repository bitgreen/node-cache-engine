import cron from 'node-cron';
import {prisma} from "./prisma";
import {initApi} from "./polkadot-api";
import {updateProjectData} from "../services/methods/createOrUpdateProject";

export const updateProjectsCron = async() => {
  cron.schedule('*/5 * * * *', async () => {
    const api = await initApi();

    let projectsData = await api.query['carbonCredits']['projects'].entries();
    // const projectsJson = projectsData.toJSON();

    // console.log(projectsData)
    projectsData.forEach(([key, project]) => {
      let [projectId] = key.toHuman() as Array<string>
      const projectData = project.toPrimitive() as any

      if(!projectData) return

      prisma.project.findUnique({
        where: { id: Number(projectId) }
      }).then(exist => {
        if(exist) {
          updateProjectData(Number(projectId), projectData)
        }
      })
    })
  });
};