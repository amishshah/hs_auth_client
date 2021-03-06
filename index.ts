import axios, { AxiosResponse } from "axios";

export const enum AuthLevels {
  // NOTE: the auth levels must be in ascending order
  Unverified,
  Applicant,
  Attendee,
  Volunteer,
  Organiser
}
const stringAuthLevels = new Map<string, AuthLevels>([
  ["unverified", AuthLevels.Unverified],
  ["applicant", AuthLevels.Applicant],
  ["attendee", AuthLevels.Attendee],
  ["volunteer", AuthLevels.Volunteer],
  ["organiser", AuthLevels.Organiser]
]);
function convertAuthLevel(authLevel: string): AuthLevels {
  if (stringAuthLevels.has(authLevel)) {
    return stringAuthLevels.get(authLevel) as AuthLevels
  } else {
    throw new Error("Auth Level Unknown");
  }
}

export type RequestUser = {
  authId: string;
  name: string;
  email: string;
  email_verified: boolean;
  authLevel: AuthLevels;
  team?: string;
};

export type Team = {
  _id: string;
  name: string;
  creator: string;
  table_no?: number;
}

export async function getCurrentUser(token: string, originalUrl: string): Promise<RequestUser> {
  let res: AxiosResponse<any>;
  try {
    res = await axios.get(`${process.env.AUTH_URL}/api/v1/users/me`, {
      headers: {
        Authorization: token,
        Referer: originalUrl
      }
    });
  } catch (err) {
    throw new Error(err);
  }

  const user = res.data;
  if (user.error && user.status >= 400) {
    throw new Error(user.error);
  }

  return {
    authId: user.user._id,
    name: user.user.name,
    email: user.user.email,
    email_verified: user.user.email_verified,
    authLevel: convertAuthLevel(user.user.auth_level),
    team: user.user.team
  };
}

export async function getAllUsers(token: string): Promise<RequestUser[]> {
  let res: AxiosResponse<any>;
  try {
    res = await axios.get(`${process.env.AUTH_URL}/api/v1/users`, {
      headers: {
        Authorization: token
      }
    });
  } catch (err) { throw err; }

  const users = res.data;
  if (users.error && users.status >= 400) { throw new Error(users.error); }

  return users.users.map((user: any) => (
    {
      authId: user._id,
      name: user.name,
      email: user.email,
      email_verified: user.email_verified,
      authLevel: convertAuthLevel(user.auth_level),
      team: user.team
    }
  ));
}

export async function putCurrentUser(name: string, token: string): Promise<void> {
  const res: AxiosResponse<any> = await axios.put(`${process.env.AUTH_URL}/api/v1/users/me`, {
    headers: {
      Authorization: token
    },
    body: {
      name: name
    }
  });

  if (res.data.error && res.status >= 400) { throw res.data.error; }
}

export async function getTeams(token: string): Promise<Team[]> {
  let res: AxiosResponse<any>;
  try {
    res = await axios.get(`${process.env.AUTH_URL}/api/v1/teams/`, {
      headers: {
        Authorization: token,
      }
    })
  } catch (err) { throw new Error(err); }

  const data: any = res.data;
  if (data.error && data.status >= 400) { throw new Error(data.error); }

  return data.teams.map((team: any) => ({
    _id: team._id,
    name: team.name,
    creator: team.creator,
    table_no: team.table_no
  }));
}

export async function getTeam(token: string, teamCode: string): Promise<Team> {
  const allTeams: Team[] = await getTeams(token);

  const team: Team | undefined = allTeams.find(team => team._id === teamCode)

  if (team === undefined) {
    throw new Error("Team not found")
  }

  return team;
}