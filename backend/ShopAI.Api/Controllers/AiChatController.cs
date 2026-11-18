using Microsoft.AspNetCore.Mvc;
using ShopAI.Application.Common;
using ShopAI.Application.DTOs;
using ShopAI.Application.Interfaces;

namespace ShopAI.Api.Controllers;

[Route("api/ai/[controller]")]
public class ChatController : ApiControllerBase
{
    private readonly IAiChatService _aiChatService;

    public ChatController(IAiChatService aiChatService)
    {
        _aiChatService = aiChatService;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ChatResponseDto>>> SendMessage(
        [FromBody] ChatRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = IsUserAuthenticated ? CurrentUserId : (Guid?)null;
        var response = await _aiChatService.SendMessageAsync(request, userId, cancellationToken);
        return Ok(ApiResponse<ChatResponseDto>.Ok(response));
    }

    [HttpGet("history/{sessionToken}")]
    public async Task<ActionResult<ApiResponse<ChatSessionDto>>> GetHistory(
        string sessionToken,
        CancellationToken cancellationToken)
    {
        var session = await _aiChatService.GetSessionHistoryAsync(sessionToken, cancellationToken);
        return Ok(ApiResponse<ChatSessionDto>.Ok(session));
    }
}
